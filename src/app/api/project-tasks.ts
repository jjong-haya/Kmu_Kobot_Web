import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "프로젝트 작업을 불러오지 못했습니다.";

export type ProjectTaskStatus = "todo" | "in_progress" | "review" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high";

export type ProjectTask = {
  id: string;
  projectTeamId: string;
  taskNumber: number;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assigneeUserId: string | null;
  createdBy: string;
  sortOrder: number;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectTaskInput = {
  projectTeamId: string;
  title: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  priority?: ProjectTaskPriority;
  assigneeUserId?: string | null;
  dueAt?: string | null;
};

type ProjectTaskDbRow = {
  id: string;
  project_team_id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assignee_user_id: string | null;
  created_by: string;
  sort_order: number;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

const PROJECT_TASK_SELECT = [
  "id",
  "project_team_id",
  "task_number",
  "title",
  "description",
  "status",
  "priority",
  "assignee_user_id",
  "created_by",
  "sort_order",
  "due_at",
  "created_at",
  "updated_at",
].join(", ");

function mapTask(row: ProjectTaskDbRow): ProjectTask {
  return {
    id: row.id,
    projectTeamId: row.project_team_id,
    taskNumber: row.task_number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeUserId: row.assignee_user_id,
    createdBy: row.created_by,
    sortOrder: row.sort_order,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectTasks(projectTeamId: string): Promise<ProjectTask[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select(PROJECT_TASK_SELECT)
    .eq("project_team_id", projectTeamId)
    .order("status", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("task_number", { ascending: true });

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  return ((data ?? []) as ProjectTaskDbRow[]).map(mapTask);
}

export async function createProjectTask(input: CreateProjectTaskInput): Promise<ProjectTask> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_project_task", {
    p_project_team_id: input.projectTeamId,
    p_title: input.title,
    p_description: input.description ?? null,
    p_status: input.status ?? "todo",
    p_priority: input.priority ?? "medium",
    p_assignee_user_id: input.assigneeUserId ?? null,
    p_due_at: input.dueAt ?? null,
  });

  if (error) throw new Error(sanitizeUserError(error, "작업을 만들지 못했습니다."));
  return mapTask(data as ProjectTaskDbRow);
}

export async function updateProjectTaskStatus(
  taskId: string,
  status: ProjectTaskStatus,
): Promise<ProjectTask> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("set_project_task_status", {
    p_task_id: taskId,
    p_status: status,
  });

  if (error) throw new Error(sanitizeUserError(error, "작업 상태를 바꾸지 못했습니다."));
  return mapTask(data as ProjectTaskDbRow);
}

export async function updateProjectTaskAssignee(
  taskId: string,
  assigneeUserId: string | null,
): Promise<ProjectTask> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("set_project_task_assignee", {
    p_task_id: taskId,
    p_assignee_user_id: assigneeUserId,
  });

  if (error) throw new Error(sanitizeUserError(error, "담당자를 바꾸지 못했습니다."));
  return mapTask(data as ProjectTaskDbRow);
}
