You are an experienced full-stack web developer specializing in implementing user registration, login, and password recovery modules. Develop a detailed architecture for this functionality based on requirements from #file:prd.md and the stack from #file:tech-stack.md.

Ensure compatibility with remaining requirements - you cannot break existing application behavior described in the documentation.

The specification should include the following elements:

1. USER INTERFACE ARCHITECTURE
- Detailed description of changes in the frontend layer (pages, components, and layouts in auth and non-auth mode), including description of new elements and those to be extended with authentication requirements
- Precise separation of responsibilities between forms and client-side React components vs. Astro pages, taking into account their integration with the authentication backend, navigation, and user actions
- Description of validation cases and error messages
- Handling of the most important scenarios

2. BACKEND LOGIC
- Structure of API endpoints and data models consistent with new user interface elements
- Input data validation mechanism
- Exception handling
- Update of server-side rendering method for selected pages taking into account @astro.config.mjs

3. AUTHENTICATION SYSTEM
- Use of Supabase Auth to implement registration, login, logout, and account recovery functionality in conjunction with Astro

Your task is to implement user interface elements (pages and forms) for the login, registration, and account recovery process. The specification is located in: @auth-spec.md

Remember the assumptions #file:astro.mdc and #file:react.mdc -

Do not implement backend or application state modifications - we will deal with these elements in the next steps

Integrate login page (astro + tsx) with the Astro backend. Start by analyzing the existing code in the context of best practices #file:astro.mdc and #file:react.mdc

The presented plan should meet the assumptions outlined in the user stories section: #prd.md

Use @supabase-auth.mdc to achieve correct integration of the login process with Supabase Auth.

Before we start, ask me 5 key technical questions addressing unclear elements of integration that will help you carry out the entire implementation from start to finish.
