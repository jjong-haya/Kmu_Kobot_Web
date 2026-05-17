import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("project study materials use private storage, guarded metadata, and a separate upload UI", () => {
  const migration = readFileSync(
    "supabase/migrations/20260512060000_project_study_material_uploads.sql",
    "utf8",
  );
  const deleteMigration = readFileSync(
    "supabase/migrations/20260516010000_delete_project_study_material.sql",
    "utf8",
  );
  const api = readFileSync("src/app/api/studies.ts", "utf8");
  const page = readFileSync("src/app/pages/member/StudyProjectPosts.tsx", "utf8");
  const detailPage = readFileSync("src/app/pages/member/StudyPostDetail.tsx", "utf8");
  const writePage = readFileSync("src/app/pages/member/StudyPostWrite.tsx", "utf8");
  const breadcrumb = readFileSync("src/app/components/member/StudyBreadcrumb.tsx", "utf8");

  assert.match(migration, /'study-materials'/);
  assert.match(migration, /false,\s*\n\s*52428800/);
  assert.match(migration, /create or replace function public\.project_team_id_from_storage_path/);
  assert.match(migration, /create or replace function public\.study_material_file_type_is_allowed/);
  assert.match(migration, /pdf\|doc\|docx\|ppt\|pptx\|xls\|xlsx/);
  assert.match(migration, /create or replace function public\.current_user_can_write_project_study_material/);
  assert.match(migration, /project_team_memberships ptm/);
  assert.match(migration, /create policy "Project study materials are readable by project members"/);
  assert.match(migration, /create policy "Project members can upload study material files"/);
  assert.match(migration, /create or replace function public\.create_project_study_material/);
  assert.match(migration, /insert into public\.study_materials/);
  assert.match(migration, /'study\.material\.create'/);
  assert.match(migration, /grant execute on function public\.create_project_study_material/);
  assert.match(deleteMigration, /create or replace function public\.delete_project_study_material/);
  assert.match(deleteMigration, /current_user_can_write_project_study_material/);
  assert.match(deleteMigration, /delete from public\.study_materials/);
  assert.match(deleteMigration, /'study\.material\.delete'/);
  assert.match(deleteMigration, /grant execute on function public\.delete_project_study_material/);

  assert.match(api, /export const STUDY_MATERIAL_ACCEPT/);
  assert.match(api, /export type StudyMaterial/);
  assert.match(api, /export async function listProjectStudyMaterials/);
  assert.match(api, /createSignedUrl\(material\.storagePath, 60 \* 10/);
  assert.match(api, /export async function uploadProjectStudyMaterial/);
  assert.match(api, /\.rpc\("create_project_study_material"/);
  assert.match(api, /export async function deleteProjectStudyMaterial/);
  assert.match(api, /\.rpc\("delete_project_study_material"/);
  assert.match(api, /\.from\(STUDY_MATERIAL_BUCKET\)\s*\.\s*remove/);
  assert.match(api, /MAX_STUDY_MATERIAL_SIZE = 50 \* 1024 \* 1024/);

  assert.match(page, /function StudyMaterialUploadDialog/);
  assert.match(page, /function StudyMaterialsSection/);
  assert.match(page, /ConfirmActionDialog/);
  assert.match(page, /자료올리기/);
  assert.match(page, /삭제/);
  assert.match(page, /스터디 자료/);
  assert.match(page, /listProjectStudyMaterials/);
  assert.match(page, /uploadProjectStudyMaterial/);
  assert.match(page, /deleteProjectStudyMaterial/);
  assert.match(page, /다운로드/);
  assert.match(page, /STUDY_MATERIAL_ACCEPT/);

  assert.match(breadcrumb, /aria-label="스터디 위치"/);
  assert.match(breadcrumb, /&gt;/);
  assert.match(page, /StudyBreadcrumb/);
  assert.match(detailPage, /StudyBreadcrumb/);
  assert.match(writePage, /StudyBreadcrumb/);
  assert.doesNotMatch(page, /<ArrowLeft/);
  assert.doesNotMatch(detailPage, /<ArrowLeft/);
  assert.doesNotMatch(writePage, /<ArrowLeft/);
});
