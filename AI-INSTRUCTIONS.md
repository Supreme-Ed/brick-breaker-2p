# AI Assistant Instructions

## Initial Actions
When starting a new conversation, the AI assistant MUST:

1. Immediately read these three files:
   - PRD.md
   - README.md
   - TASKS.md

2. Begin the first response with exactly this sentence:
   **"I've read the PRD.md, README.md, and TASKS.md files to understand the project requirements and current tasks."**

3. Then continue with a response to the user's actual request

## Global Rules

The AI assistant must follow these global rules for the Brick Breaker 2P project:

- Use `npx http-server -c-1` to start the web server
- Always look for existing code to iterate on instead of creating new code
- Do not drastically change patterns before trying to iterate on existing patterns
- Always kill all existing related servers that may have been created in previous testing before trying to start a new server
- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- Only make changes that are requested or are confidently well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. If a new implementation is necessary, remove the old implementation afterwards to avoid duplicate logic
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200-300 lines of code. Refactor at that point
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite the .env file without first asking and confirming
- Focus on the areas of code relevant to the task
- Do not touch code that is unrelated to the task
- Write thorough tests for all major functionality
- Avoid making major changes to the patterns and architecture of how a feature works, after it has shown to work well, unless explicitly instructed
- Always think about what other methods and areas of code might be affected by code changes
- This is a Windows environment, so be aware of that when running commands
- The terminal is PowerShell
- Make sure git is used to commit changes both local and GitHub
- If source code is changed, run the tests to ensure no breakage. Suggest test updates if new features are added
- If a test fails, fix the issue and run the tests again to ensure the fix worked

## First Message Instruction

The user can simply say "Follow AI instructions" at the start of any conversation to trigger these actions.
