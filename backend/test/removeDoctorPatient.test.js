import test from "node:test";
import assert from "node:assert/strict";
import Doctor from "../src/models/Doctor.js";
import Patient from "../src/models/Patient.js";
import { removeDoctorPatient } from "../src/controllers/doctorController.js";

const patientId = "507f1f77bcf86cd799439011";
const doctorId = "507f1f77bcf86cd799439012";
const request = (role = "doctor", id = patientId) => ({ user: { id: "doctor-user", role }, params: { id } });
function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("removes only the current doctor's link, without deleting the patient or exams", async (t) => {
  t.mock.method(Doctor, "findOne", async (query) => {
    assert.deepEqual(query, { userId: "doctor-user" });
    return { _id: doctorId };
  });
  t.mock.method(Patient, "findOneAndUpdate", async (filter, update, options) => {
    assert.deepEqual(filter, { _id: patientId, doctorId });
    assert.deepEqual(update, { $set: { doctorId: null } });
    assert.deepEqual(options, { returnDocument: "after", runValidators: true });
    return { _id: patientId, doctorId: null };
  });
  const res = response();
  await removeDoctorPatient(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.patientId, patientId);
});

test("refuses patients belonging to another doctor and already removed patients", async (t) => {
  t.mock.method(Doctor, "findOne", async () => ({ _id: doctorId }));
  t.mock.method(Patient, "findOneAndUpdate", async (filter) => {
    assert.equal(filter.doctorId, doctorId);
    return null;
  });
  const res = response();
  await removeDoctorPatient(request(), res);
  assert.equal(res.statusCode, 404);
});

test("refuses non-doctor accounts without querying the database", async (t) => {
  const query = t.mock.method(Doctor, "findOne", async () => { throw new Error("Unexpected database access"); });
  const res = response();
  await removeDoctorPatient(request("patient"), res);
  assert.equal(res.statusCode, 403);
  assert.equal(query.mock.callCount(), 0);
});

test("rejects an invalid patient identifier before querying the database", async (t) => {
  const query = t.mock.method(Doctor, "findOne", async () => { throw new Error("Unexpected database access"); });
  const res = response();
  await removeDoctorPatient(request("doctor", "invalid-id"), res);
  assert.equal(res.statusCode, 400);
  assert.equal(query.mock.callCount(), 0);
});

test("refuses a doctor account without a doctor profile", async (t) => {
  t.mock.method(Doctor, "findOne", async () => null);
  const update = t.mock.method(Patient, "findOneAndUpdate", async () => { throw new Error("Unexpected update"); });
  const res = response();
  await removeDoctorPatient(request(), res);
  assert.equal(res.statusCode, 404);
  assert.equal(update.mock.callCount(), 0);
});

test("reports an update failure instead of claiming success", async (t) => {
  t.mock.method(Doctor, "findOne", async () => ({ _id: doctorId }));
  t.mock.method(Patient, "findOneAndUpdate", async () => { throw new Error("Database unavailable"); });
  const res = response();
  await removeDoctorPatient(request(), res);
  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /Não foi possível remover/);
});
