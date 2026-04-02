/**
 * BASE44 DEMO APP — APP SPEC
 * Task management app with users, tasks, due dates, priorities, and team assignments.
 * Version: 1.0.0 | Env: production
 */

export const BASE44_DEMO_APP_SPEC = {
  app: {
    name: "Base44 Demo App",
    id: "base44-demo-app",
    description: "Task management app with users, tasks, due dates, priorities, and team assignments.",
    version: "1.0.0",
    env: "production"
  },

  frontend: {
    framework: "react",
    routing: "file-based",
    theme: {
      primaryColor: "#3B82F6",
      secondaryColor: "#0F172A",
      fontFamily: "Inter"
    },
    pages: [
      {
        path: "/",
        name: "Dashboard",
        layout: "main",
        components: ["TaskSummaryCards", "OverdueTasksList", "TeamActivityFeed"]
      },
      {
        path: "/tasks",
        name: "Tasks",
        layout: "main",
        components: ["TaskTable", "TaskFilters", "NewTaskModal"]
      },
      {
        path: "/teams",
        name: "Teams",
        layout: "main",
        components: ["TeamList", "TeamMembersPanel"]
      }
    ]
  },

  backend: {
    auth: {
      enabled: true,
      providers: ["email_password", "google"],
      roles: ["admin", "manager", "member"]
    },

    database: {
      provider: "base44-managed",
      entities: [
        {
          name: "User",
          table: "users",
          fields: [
            { name: "id", type: "string", primaryKey: true },
            { name: "email", type: "string", unique: true },
            { name: "name", type: "string" },
            { name: "role", type: "enum", values: ["admin", "manager", "member"] },
            { name: "createdAt", type: "datetime", default: "now" }
          ]
        },
        {
          name: "Team",
          table: "teams",
          fields: [
            { name: "id", type: "string", primaryKey: true },
            { name: "name", type: "string" },
            { name: "description", type: "string", nullable: true },
            { name: "createdAt", type: "datetime", default: "now" }
          ],
          relations: [
            { type: "many-to-many", target: "User", through: "TeamMember" }
          ]
        },
        {
          name: "TeamMember",
          table: "team_members",
          fields: [
            { name: "id", type: "string", primaryKey: true },
            { name: "teamId", type: "string", index: true },
            { name: "userId", type: "string", index: true },
            { name: "role", type: "enum", values: ["owner", "member"] }
          ]
        },
        {
          name: "Task",
          table: "tasks",
          fields: [
            { name: "id", type: "string", primaryKey: true },
            { name: "title", type: "string" },
            { name: "description", type: "text", nullable: true },
            { name: "status", type: "enum", values: ["todo", "in_progress", "done"] },
            { name: "priority", type: "enum", values: ["low", "medium", "high"] },
            { name: "dueDate", type: "date", nullable: true },
            { name: "assigneeId", type: "string", index: true, nullable: true },
            { name: "teamId", type: "string", index: true },
            { name: "createdAt", type: "datetime", default: "now" },
            { name: "updatedAt", type: "datetime", default: "now" }
          ]
        }
      ]
    },

    functions: [
      {
        name: "createTask",
        trigger: "http",
        path: "/api/tasks",
        method: "POST",
        authRequired: true,
        roleAccess: ["manager", "admin"],
        inputSchema: {
          title: "string",
          description: "string?",
          priority: "low|medium|high",
          dueDate: "date?",
          assigneeId: "string?",
          teamId: "string"
        }
      },
      {
        name: "listTasks",
        trigger: "http",
        path: "/api/tasks",
        method: "GET",
        authRequired: true,
        roleAccess: ["member", "manager", "admin"],
        queryParams: {
          status: "string?",
          teamId: "string?",
          assigneeId: "string?",
          search: "string?"
        }
      }
    ]
  },

  ai: {
    enabled: true,
    provider: "base44-default",
    models: [
      {
        name: "taskAssistant",
        type: "chat",
        model: "gpt-4.1-mini",
        tools: ["listTasks", "createTask"],
        permissions: {
          entities: {
            Task: ["read", "create"],
            Team: ["read"],
            User: ["read"]
          }
        }
      }
    ]
  },

  integrations: {
    email: {
      provider: "sendgrid",
      enabled: true,
      fromAddress: "no-reply@base44-demo.app"
    }
  },

  deployment: {
    hosting: "base44-managed",
    region: "us-east-1",
    previewEnvironments: true,
    autoDeployOnGitPush: true
  }
};