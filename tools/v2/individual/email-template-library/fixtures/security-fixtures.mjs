export const safeTemplateDraft = {
  id: "welcome-customer",
  name: "Welcome Customer",
  categoryId: "onboarding",
  subject: "Welcome, {{firstName}}",
  body: "Hi {{firstName}},\n\nThanks for joining {{companyName}}. Reply here if you need help getting started.",
  variables: [
    { key: "firstName", label: "First name" },
    { key: "companyName", label: "Company name" },
  ],
};

export const hostileTemplateDrafts = [
  {
    id: "script-template",
    name: "Script Template",
    categoryId: "unsafe",
    subject: "Update",
    body: "Hello <script>alert('x')</script>",
    variables: [],
  },
  {
    id: "secret-template",
    name: "Secret Template",
    categoryId: "unsafe",
    subject: "Credentials",
    body: "api_key = do-not-store-secrets-in-templates",
    variables: [],
  },
  {
    id: "handler-template",
    name: "Handler Template",
    categoryId: "unsafe",
    subject: "Click",
    body: "<a onclick=\"send()\" href=\"javascript:alert(1)\">open</a>",
    variables: [],
  },
];

export const oversizedTemplateDraft = {
  id: "oversized",
  name: "Oversized",
  categoryId: "limits",
  subject: "A".repeat(300),
  body: "B".repeat(13000),
  variables: [],
};
