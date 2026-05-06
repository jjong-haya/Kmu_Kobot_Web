import test from "node:test";
import assert from "node:assert/strict";
import {
  findCollege,
  findCollegeByDepartment,
  inferAcademicPlacementFromProfileName,
  normalizeCollegeName,
  normalizeDepartmentName,
  normalizeLookupText,
} from "../src/app/auth/kookminAcademic.ts";

test("normalizeLookupText: NFKC + lower + strip whitespace/punct/middot", () => {
  assert.equal(normalizeLookupText("소프트웨어 융합대학"), "소프트웨어융합대학");
  assert.equal(normalizeLookupText("S.W.대학"), "sw대학");
  assert.equal(normalizeLookupText("미디어·광고학부"), "미디어광고학부");
  assert.equal(normalizeLookupText("ＳＷ"), "sw");
});

test("findCollege resolves canonical label", () => {
  const result = findCollege("소프트웨어융합대학");
  assert.ok(result);
  assert.equal(result.label, "소프트웨어융합대학");
});

test("findCollege resolves aliases", () => {
  assert.equal(findCollege("소융대")?.label, "소프트웨어융합대학");
  assert.equal(findCollege("공대")?.label, "창의공과대학");
  assert.equal(findCollege("법대")?.label, "법과대학");
});

test("findCollege returns null for unknown values", () => {
  assert.equal(findCollege(null), null);
  assert.equal(findCollege(undefined), null);
  assert.equal(findCollege(""), null);
  assert.equal(findCollege("존재하지않는대학"), null);
});

test("findCollegeByDepartment resolves SW department to SW college", () => {
  assert.equal(findCollegeByDepartment("소프트웨어학부")?.label, "소프트웨어융합대학");
  assert.equal(findCollegeByDepartment("인공지능학부")?.label, "소프트웨어융합대학");
});

test("findCollegeByDepartment is whitespace/case insensitive", () => {
  assert.equal(findCollegeByDepartment(" 소프트웨어 학부 ")?.label, "소프트웨어융합대학");
});

test("normalizeCollegeName returns canonical or empty string", () => {
  assert.equal(normalizeCollegeName("공대"), "창의공과대학");
  assert.equal(normalizeCollegeName(null), "");
  assert.equal(normalizeCollegeName("blah"), "");
});

test("normalizeDepartmentName resolves dept canonical when college matches", () => {
  assert.equal(
    normalizeDepartmentName("소프트웨어융합대학", "소프트웨어학부"),
    "소프트웨어학부",
  );
});

test("normalizeDepartmentName falls back to department-college lookup", () => {
  assert.equal(
    normalizeDepartmentName("", "소프트웨어학부"),
    "소프트웨어학부",
  );
});

test("normalizeDepartmentName returns empty for unknown department", () => {
  assert.equal(normalizeDepartmentName("소프트웨어융합대학", "존재안함학부"), "");
  assert.equal(normalizeDepartmentName("", null), "");
});

test("inferAcademicPlacementFromProfileName: empty for null/undefined", () => {
  const empty = {
    fullName: null,
    rawAffiliation: null,
    department: null,
    college: null,
  };
  assert.deepEqual(inferAcademicPlacementFromProfileName(null), empty);
  assert.deepEqual(inferAcademicPlacementFromProfileName(undefined), empty);
  assert.deepEqual(inferAcademicPlacementFromProfileName(""), empty);
});

test("inferAcademicPlacementFromProfileName: name only when no parens", () => {
  const result = inferAcademicPlacementFromProfileName("홍길동");
  assert.equal(result.fullName, "홍길동");
  assert.equal(result.rawAffiliation, null);
  assert.equal(result.department, null);
  assert.equal(result.college, null);
});

test("inferAcademicPlacementFromProfileName: name + dept in parens", () => {
  const result = inferAcademicPlacementFromProfileName("홍길동(소프트웨어학부)");
  assert.equal(result.fullName, "홍길동");
  assert.equal(result.department, "소프트웨어학부");
  assert.equal(result.college, "소프트웨어융합대학");
});

test("inferAcademicPlacementFromProfileName: hyphenated affiliation picks last segment", () => {
  const result = inferAcademicPlacementFromProfileName("김철수(소프트웨어융합대학-소프트웨어학부)");
  assert.equal(result.fullName, "김철수");
  assert.equal(result.department, "소프트웨어학부");
  assert.equal(result.college, "소프트웨어융합대학");
});

test("inferAcademicPlacementFromProfileName: zero-width chars stripped", () => {
  const result = inferAcademicPlacementFromProfileName("​홍길동‌(소프트웨어학부)﻿");
  assert.equal(result.fullName, "홍길동");
  assert.equal(result.department, "소프트웨어학부");
});
