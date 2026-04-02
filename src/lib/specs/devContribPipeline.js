/**
 * DEVELOPER CONTRIBUTION PIPELINE — APP SPEC
 * Full workflow management system modeling the contribution pipeline
 * from idea to deployment across 7 stages.
 * Version: 1.0.0
 */

export const DEV_CONTRIB_PIPELINE_SPEC = {
  app: {
    name: "Developer Contribution Pipeline",
    id: "dev-contrib-pipeline",
    description: "A workflow management system modeling the full developer contribution pipeline from idea to deployment.",
    version: "1.0.0"
  },

  auth: {
    providers: ["email_password"],
    roles: ["admin", "maintainer", "contributor", "viewer"]
  },

  database: {
    entities: [
      {
        name: "Stage",
        table: "stages",
        fields: [
          { name: "id", type: "string", primaryKey: true },
          { name: "name", type: "string" },
          { name: "order", type: "number" },
          { name: "description", type: "text" }
        ]
      },
      {
        name: "Issue",
        table: "issues",
        fields: [
          { name: "id", type: "string", primaryKey: true },
          { name: "title", type: "string" },
          { name: "description", type: "text" },
          { name: "status", type: "string" },
          { name: "stageId", type: "string", index: true },
          { name: "assigneeId", type: "string", nullable: true },
          { name: "createdAt", type: "datetime", default: "now" },
          { name: "updatedAt", type: "datetime", default: "now" }
        ]
      },
      {
        name: "Contribution",
        table: "contributions",
        fields: [
          { name: "id", type: "string", primaryKey: true },
          { name: "issueId", type: "string", index: true },
          { name: "branchName", type: "string" },
          { name: "prUrl", type: "string", nullable: true },
          { name: "status", type: "string" },
          { name: "createdAt", type: "datetime", default: "now" }
        ]
      },
      {
        name: "StageTransition",
        table: "stage_transitions",
        fields: [
          { name: "id", type: "string", primaryKey: true },
          { name: "issueId", type: "string", index: true },
          { name: "fromStageId", type: "string" },
          { name: "toStageId", type: "string" },
          { name: "timestamp", type: "datetime", default: "now" }
        ]
      }
    ]
  },

  functions: [
    {
      name: "createIssue",
      trigger: "http",
      path: "/api/issues",
      method: "POST",
      authRequired: true,
      roleAccess: ["contributor", "maintainer", "admin"],
      inputSchema: { title: "string", description: "string" }
    },
    {
      name: "advanceStage",
      trigger: "http",
      path: "/api/issues/:id/advance",
      method: "POST",
      authRequired: true,
      roleAccess: ["maintainer", "admin"],
      inputSchema: { toStageId: "string" }
    },
    {
      name: "createContribution",
      trigger: "http",
      path: "/api/contributions",
      method: "POST",
      authRequired: true,
      roleAccess: ["contributor", "maintainer", "admin"],
      inputSchema: { issueId: "string", branchName: "string" }
    }
  ],

  ai: {
    enabled: true,
    models: [
      {
        name: "pipelineAssistant",
        type: "chat",
        model: "gpt-4.1-mini",
        tools: ["createIssue", "advanceStage", "createContribution"],
        permissions: {
          entities: {
            Issue: ["read", "create", "update"],
            Stage: ["read"],
            Contribution: ["read", "create"],
            StageTransition: ["read"]
          }
        }
      }
    ]
  },

  ui: {
    layouts: [
      {
        name: "main",
        type: "sidebar",
        menu: [
          { label: "Dashboard", path: "/" },
          { label: "Kanban", path: "/kanban" },
          { label: "Issues", path: "/issues" },
          { label: "Contributions", path: "/contributions" },
          { label: "Stages", path: "/stages" }
        ]
      }
    ],
    pages: [
      {
        path: "/",
        name: "Dashboard",
        layout: "main",
        components: ["PipelineStats", "StageProgressChart", "RecentIssues", "RecentContributions"]
      },
      { path: "/kanban", name: "Kanban Board", layout: "main", components: ["KanbanBoard"] },
      { path: "/issues", name: "Issues", layout: "main", components: ["IssueTable", "NewIssueModal"] },
      { path: "/contributions", name: "Contributions", layout: "main", components: ["ContributionTable"] }
    ]
  },

  kanban: {
    board: {
      entity: "Issue",
      columnField: "stageId",
      columnsSource: "Stage",
      cardFields: ["title", "assigneeId", "status", "updatedAt"]
    }
  },

  dashboard: {
    widgets: [
      { type: "metric", title: "Open Issues", entity: "Issue", filter: { status: "open" } },
      { type: "metric", title: "Active Contributions", entity: "Contribution", filter: { status: "active" } },
      { type: "chart", title: "Issues by Stage", entity: "Issue", groupBy: "stageId", chartType: "bar" },
      { type: "timeline", title: "Recent Stage Transitions", entity: "StageTransition", limit: 20 }
    ]
  },

  integrations: {
    github: {
      enabled: true,
      repo: "your-org/your-repo",
      webhooks: {
        pull_request: "/api/github/pr",
        push: "/api/github/push"
      },
      automations: [
        {
          event: "pull_request.opened",
          action: "createContribution",
          mapping: { issueId: "payload.issue.id", branchName: "payload.pull_request.head.ref" }
        },
        {
          event: "pull_request.merged",
          action: "advanceStage",
          mapping: { toStageId: "6" }
        }
      ]
    }
  },

  seed: {
    stages: [
      { id: "1", name: "Ideation",    order: 1, description: "Initial idea and issue creation." },
      { id: "2", name: "Planning",    order: 2, description: "Scoping, assignment, and acceptance criteria." },
      { id: "3", name: "Development", order: 3, description: "Coding, testing, and local validation." },
      { id: "4", name: "Pull Request",order: 4, description: "PR creation and review." },
      { id: "5", name: "CI/CD",       order: 5, description: "Automated checks and integration." },
      { id: "6", name: "Deployment",  order: 6, description: "Staging, canary, and production rollout." },
      { id: "7", name: "Monitoring",  order: 7, description: "Post-deployment validation and feedback." }
    ]
  }
};