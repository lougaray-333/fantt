-- ==========================================================================
-- Supabase Dashboard SQL Editor
-- Setup script for activities and bug_reports tables
-- Generated from activityDatabase.js (69 activities)
-- ==========================================================================

-- ============================================================
-- 1. Activities table
-- ============================================================
create table activities (
  id text primary key,
  in_by_default boolean default false,
  name text not null,
  phase text not null,
  duration text default '',
  duration_days integer default 0,
  duration_days_min integer default 0,
  duration_days_max integer default 0,
  owner text default '',
  contributors text default '',
  scoping text default '',
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. Bug reports table
-- ============================================================
create table bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  replication_steps text not null,
  actual_result text not null,
  expected_result text not null,
  status text default 'open',
  admin_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. Insert all 69 activities
-- ============================================================

-- ─── INSIGHT PHASE ───────────────────────────────────────────────

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-01', true, 'Kickoff & Immersion', 'Insight', '1-5 days', 1, 1, 5,
  'Project DRI', 'All disciplines',
  'Kickoff are best done in person. If done remotely, you could adjust your kick off approach so that you''re tackling 2 or 3, 1hr sessions per day over several days.',
  'All of our projects begin with collaborative sessions. During this period we''ll:
- Understand your experience vision and goals
- Understand your competitors
- Understand your unique differentiators
- Discuss existing brand attributes
- Review existing features and functionality
- Review product and audience research
- Discuss technical limitations and considerations'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-02', true, 'Stakeholder Interviews', 'Insight', '1-3 weeks', 5, 5, 15,
  'Project DRI', 'All disciplines',
  'Dont skimp on this. The more people we talk to the more it opens up for organic growth convos down the line',
  'We''ll meet with your stakeholders to identify:
- Key organizational insights
- Key audience insights
- Their roles and responsibilities on this engagement
- Their desires for this engagement, and any risks they can help us identify in its delivery'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-03', true, 'High-level business goal and KPI setting', 'Insight', '1-3 weeks', 5, 5, 15,
  'Product Management', 'All disciplines',
  'High-level KPIs are often uncovered as part of the stakeholder interview process',
  'We will work with senior leadership, stakeholders, and analysts to identify high-level goals and KPIs. As we do this together, we will identify the following for our project:
- The high-level business and goals we must impact
- The KPI metrics we will use to measure our success
- The impact on those metrics, and what will deem us successful'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-04', true, 'Organizational capabilities evaluation', 'Insight', '1-3 weeks', 5, 5, 15,
  'Product Management', 'Production',
  'Organizational capabilities are often uncovered as part of the stakeholder interview process',
  'A great product is only realized by combining vision with the ability to execute on it. Understanding your capabilities allows us to tailor our approach. We will understand your resourcing and skillsets in:
- Strategy and research
- Content strategy and production
- Design and testing
- Development and QA'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-05', false, 'Data and measurement tool assessment', 'Insight', '1 week', 5, 5, 5,
  'Data Science', '', '',
  'We will evaluate the processes, tools, and data sources available for measuring the performance of the future digital experience that we create together. As part of this assessment, we will:
- Map all available data sources, assess how well integrated they are, and evaluate their overall level of quality.
- Audit the measurement tools at our disposal, and assess how well configured they are.
- Assess current reporting and analysis approaches.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-06', false, 'Experience Audit', 'Insight', '1 week', 5, 5, 5,
  'UX', 'Content/UI',
  'Less intensive than a heuristic evaluation, Experience Audits are used to understand a client''s current-state when it comes to their digital properties. The output often includes a summary of areas for opportunity.',
  'Less robust than a Heuristic Evaluation, an Experience Audit captures Fantasy''s point of view on your current user experience across a single product or digital ecosystem. An experience audit will consider how well your experience is serving the needs of your target audience.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-07', false, 'Heuristic evaluation', 'Insight', '2 weeks', 10, 10, 10,
  'UX', 'Content/UI',
  'Heuristic evaluations are typically more robust than Experience Audits. Project teams should carefully consider what is necessary for their specific project',
  'This is a primary research tool to assess the current state and usability of your experience. It provides an expert, unbiased assessment across a range of established best practices and serves as the basis for recommendations and opportunities to improve your experience. Criteria may include:
- Aesthetics
- Ease of use
- Error prevention
- Consistency
- Help and recovery
- Language/tone of voice'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-08', false, 'Existing business model canvas exercise', 'Insight', '1 week', 5, 5, 5,
  'Product Management', 'Product Management', '',
  'We''ll meet with the appropriate stakeholders in your company and use this activity to identify your organization''s:
- Problem and vision
- Key metrics
- Cost structure
- Revenue streams
- Customer segments
- Unfair advantage
- Channels
- Unique value proposition'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-09', false, 'Technical discovery', 'Insight', '3-4 weeks', 15, 15, 20,
  'Product Management', 'Product Management',
  'Fantasy needs to partner with technical vendors to conduct technical discovery',
  'We will conduct a holistic analysis of the tech stack, so we understand how it might enable our future digital experience. In this analysis, we will:
- Evaluate the systems, platforms, and middleware that underpin our digital experience.
- Assess how well integrated they are, and check whether any important tools are missing.
- Summarize how our current stack is set up, what it will enable, and where it might need improvement.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-10', false, 'Research Review and Gap Analysis', 'Insight', '1 week', 5, 5, 5,
  'Research and Insights', '',
  'Production can and should start to compile research materials from the client BEFORE project kick off to help the R&I team to get started on their research review as quickly as possible',
  'Building on our research review, we will identify the gaps in current user insights to be filled in order to deliver an effective digital vision. As part of this exercise, we will:
- Identify the core focus areas and themes in the existing user research.
- Map where we need to gather additional insights to deepen our understanding of user needs.
- Make recommendations for further bespoke user research to be conducted as part of our project.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-11', false, 'Landscape Analysis', 'Insight', '1-2 weeks', 5, 5, 10,
  'UX', 'Content/UI/Product',
  'Depending on the project, a landscape analysis can be an internal-facing exercise that helps to inform our Insights and eventual product ideation. However, some projects will require in-depth landscape analysis, in which case you may consider using the high time estimate for the work.',
  'Together, we will review a list of competitors and inspirational, out-of-category organizations to identify:
- Content, brand, design and functional characteristics
- Trends relevant to the industry
- Learnings and how we can adapt accordingly'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-12', false, 'Future World Analysis', 'Insight', '1-2 days', 1, 1, 2,
  'Data Science', 'UX',
  'The data science team requires a brief to understand the goals of the activity. What are we looking to learn? What sources might we want to use in our research?',
  'Using our comprehensive sources for market activity & patent filings, we are able to turn complexity into clarity and show you what''s just around the corner, enabling you to:
- Get an actionable view of what''s around the corner.
- Spot emerging trends and patterns across industries
- Distilled down to the most relevant insights and findings
- If desired, chat with our curated data sources via an AI assistant to allow for further analysis'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-13', false, 'Strategic SEO assessment', 'Insight', '1 week', 5, 5, 5,
  'Data Science', 'Content', '',
  'SEO analysis is a great source of insight into why users are visiting your site and what they are hoping to achieve on it. With an SEO assessment, we will:
- Look at the macro trends driving search behavior in a category, and map them to our target personas.
- Analyze how well a site is doing at capturing search intent in the market, relative to competitors.
- Generate SEO/SEM and editorial strategies that will help clients grow exponentially.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-14', false, 'Ecosystem Map', 'Insight', '1-2 weeks', 5, 5, 10,
  'UX', 'Content/Product', '',
  'An ecosystem in UX is a big-picture visualization of the "who, what, when, where, how" of users and brand interactions. It is a tool to help all stakeholders understand the environment in which an experience operates. It includes these elements and shows the exchange of value between:
- Users
- Services
- Devices
- Channels'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-15', false, 'Existing functionality baseline', 'Insight', '1-2 weeks', 5, 5, 10,
  'UX', '', '',
  'Using our landscape and heuristic analysis as a basis, we will document the key features and functionality that exist today. We may also compare how existing functionalities compare to competitors.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-16', false, 'Content Audit and Gap Analysis', 'Insight', '2-3 weeks', 10, 10, 15,
  'Content Strategy', 'Data Science',
  'You should split this activities up - ideally at least a week for each, depends on extent of content/project',
  'Auditing your existing content not only provides a full picture of what you have, it also generates ideas to evolve your product in the future, while providing a clear plan for content migration and updating. We will comb through your digital ecosystem to categorize and score content, both by traditional metrics (like content type and metadata) and human-centered categories (like message clarity, voice, and action orientation).

A content gap analysis will reveal where your content is falling short against your own goals and the competitive landscape, so we can create a forward-looking content system. We will chart the content audit alongside your target user personas to determine which content types, topics, or formats are underrepresented, and which are missing completely.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-17', false, 'Social content performance review', 'Insight', '3 days - 2 weeks', 3, 3, 10,
  'Content Strategy', 'Data Science',
  'Option to tie this in with "Voice of the User" - duration varies with amount of channels/posts reviewed',
  'For experiences with goals that include sharing content and social engagement, a review of how your content shows up publicly will help better position your brand for success on some of the highest engagement platforms. Our team will test and review how your content appears and performs outside your owned ecosystem, to help us suggest improvements in both form and substance so your brand is better represented.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-18', false, 'Brand health analysis', 'Insight', '1 week', 5, 5, 5,
  'Content Strategy', 'Data Science',
  'Option to tie this in with "Voice of the User" to get user opinions on brand',
  'A careful comparison of how your brand is perceived against your stated brand values and key competitors is crucial to creating unique, cohesive content that delivers on short- and long-term goals. We will review your organization''s mission, vision, and digital brand expressions, analyzing how they function in the market. Our analysis will provide a clear path for making informed, on-brand choices for content, messaging, and the experience as a whole.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-19', false, 'Quantified user journeys', 'Insight', '2 weeks', 10, 10, 10,
  'Research and Insights', '',
  'Best used for product-redesign projects. Less useful for 0-1 product design.',
  'The job of a quantified user journey is to visualize how people interact with your experience today, and where the biggest opportunities for improvement and innovation can be found. To gather the data for this, we will complement qualitative discovery with quantitative surveys that:
- Measure the importance of different jobs to be done to our users.
- Quantify usage of touch points and the size of the pain points that users have.
- Measure where, across their journey, they are experiencing the most friction that we can solve through design.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-20', false, 'Current state user journey', 'Insight', '1-2 weeks', 5, 5, 10,
  'UX', '', '',
  'A current state user journey will visualize the experience that users are having today when they are interacting with your experience. It will cover:
- Key stages of their current journey
- Goals and tasks they are trying to achieve at each stage of their journey
- How they are feeling during each stage
- Pain points they experience during each stage
- Ecosystem touch points that users are engaging with and using during each stage'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-21', false, 'Storytelling workshop', 'Insight', '1 day', 1, 1, 1,
  'Research and Insights', 'All disciplines', '',
  'Once we have gathered insights into our users, we will run energizing workshops to story-tell our insights, and identify innovation opportunities together. In these, we will:
- Tell stories about the users we have met, and share the key insights we gathered from them.
- Create key insight themes that can form the basis of future innovation opportunities.
- Generate initial solution hunches for what our future experience can do to solve audience needs.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-22', false, 'Behavioral analytics', 'Insight', '1 week', 5, 5, 5,
  'Data Science', 'UX/Product Management',
  'UX and Product Management to identify specific questions that we would like to be answered via the Behavioral Analytics analysis.',
  'We will conduct bespoke behavioral analytics to get a deeper understanding of how our users are behaving within our digital experience and set benchmark metrics for us to improve. This will involve analyzing:
- Engagement with sections and features within the experience to identify which ones need improvement
- The user segments we engage with most, and the user segments we need to engage with more in the future
- The typical flows that users take through the experience, and where they are experiencing moments of friction that need to be alleviated'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-23', false, 'CX analytics', 'Insight', '2-5 weeks', 10, 10, 25,
  'Data Science', 'Research and Insights/Product Management', '',
  'CX analytics will help us understand and further identify improvements that we can make to the experience. We will:
- Conduct intercept CX polls to capture user feedback and identify potential improvement areas.
- Leverage heat maps and scroll maps to spot opportunities for page optimization.
- Use session recordings to see how users are traveling through a site and where they are having issues.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-24', false, 'Audience research', 'Insight', '4-6 weeks', 20, 20, 30,
  'Research and Insights', '',
  'There are 4 distinct steps to initial audience research: Research plan development, recruitment, testing, and analysis. Each step takes approx. 1 week and requires time for an Insights Coordinator as well as an Insights Lead/Sr.',
  'Research and Insights should be consulted to identify which methodology is appropriate for the first round of audience research.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-25', false, 'Mobile ethnography', 'Insight', 'TBD', 5, 5, 10,
  'Research and Insights', '', '',
  'Mobile ethnography will capture in-the-moment, contextual insights that uncover innovation opportunities for our future experience. Over the course of a few days, participants will use an app on their phones to:
- Go through a user journey and highlight their needs, behaviors, and pain points at every step.
- Deliver picture-in-picture recordings of themselves using the current experience, showing where they are experiencing moments of friction.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-26', false, 'Online community', 'Insight', 'TBD', 10, 10, 20,
  'Research and Insights', '', '',
  'Online communities are a consistent, dedicated, and available group of users that can to co-create with us end-to-end in a project. By having a dedicated online community, we will be able to:
- Invite users to document and prioritize their most important needs from the future experience.
- Request users to co-create the future experience together with us.
- Test out the desirability of early concepts and prototypes to make sure they meet our users'' needs.
- Conduct usability testing on our designs to ensure they are easy to use.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-27', false, 'In-depth interviews', 'Insight', 'TBD', 5, 5, 10,
  'Research and Insights', '', '',
  'We will conduct in-depth user interviews to uncover opportunities for innovation, and illuminate problem areas to solve. In these interviews, we will:
- Explore and understand our users'' overall motivations and needs.
- Map the end-to-end user journey, and identify opportunities for innovation.
- Uncover pain points that users are having with the current state experience.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-28', false, 'Immersive insight safaris', 'Insight', 'TBD', 5, 5, 10,
  'Research and Insights', '', '',
  'Insight safaris involve observing and interviewing users in real-life environments. Our insight safari will help us to design a more compelling solution by enabling us to:
- Understand the cultural context of the users we are designing for.
- Observe users'' real behavior within the places they will be using our experience.
- Tag along with people to observe the day-to-day routines our future experience needs to serve.
- Capture videos and photos that will bring user needs to life and inspire our designers.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-29', false, 'User personas', 'Insight', '1-2 weeks', 5, 5, 10,
  'UX', 'Content/Product Management',
  'All depends on the amount of existing research they have to date and if that research has been validated by research',
  'Personas help to summarize the key user needs, experiences, behaviors, and goals you need to serve each of your priority audiences. They usually cover:
- Personal life goals, behaviors and motivations that our product can tap into
- The core needs or "Jobs to Be Done" that this product needs to serve for each of our audience segments
- The pain points or problems that we can solve for each of these audiences'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'insight-30', false, 'Insights Synthesis', 'Insight', '2.5 weeks', 12, 12, 12,
  'Research and Insights', 'All disciplines',
  'This activity requires .5 weeks to align internally on insights from the landscape, business, experience and users before workshopping our Insights (sometimes called Solution Hypotheses) with the client.',
  'Having gathered rich information from your landscape, experience, business and audience, we will synthesize these learnings into strategic perspectives to inform how we should develop our future product. This summation will give us a clear perspective, as a unified team, on considerations we should hold top of mind as we move into the Vision phase.'
);

-- ─── VISION PHASE ────────────────────────────────────────────────

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-01', false, 'Brand positioning', 'Vision', '2 weeks', 10, 10, 10,
  'Content Strategy', '',
  'Depends on client size and involvement - AI helps with writing',
  'Brand positioning is a holistic picture of how you''d like your brand to be perceived by customers in relation to competitors. We will break down your target audiences and competitors, and write a positioning statement your brand can use as a North Star, while creating a new experience. Workshopping with key stakeholders, we will collaborate on a brand position that differentiates your new experience in a competitive landscape.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-02', false, 'Messaging Strategy', 'Vision', '2-3 weeks', 10, 10, 15,
  'Content Strategy', '',
  'The optional tagline exploration can take another 2-4 weeks',
  'We will distill your experience''s most important benefits into core messaging guidelines grounded in your brand attributes. These guidelines will instruct content creators on how to use your brand''s voice, and engage your audience. We will provide primary and secondary messaging to serve as foundational materials for your organization to help you produce streamlined content and campaign work.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-03', false, 'Content Taxonomy', 'Vision', '2-3 weeks', 10, 10, 15,
  'Content Strategy', '', '',
  'In order for end users to find and engage with content, you must properly sort, categorize and name how content appears. Together, we will identify categories of content to meet user needs and drive engagement, while also meeting business goals. We will marry strategic organization with tactical examples to ensure you can manage content creation on your own once the experience is up and running.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-04', false, 'Brand mission and values', 'Vision', '2-4 weeks', 10, 10, 20,
  'Content Strategy', '', '',
  'Crafting your product''s brand mission and values ensures that the experience stays focused on the business goals that matter most. Distilling your product''s core tenets ensures your product is relatable to users, streamlines the creative process, and distinguishes your properties from competitors. Based on stakeholder interviews and ongoing research and analysis, we will distill your product''s mission statement, core values, and personality traits, and then present them to you for your internal use.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-05', false, 'Product naming', 'Vision', '2+ weeks', 10, 10, 15,
  'Content Strategy', 'All disciplines',
  'Excludes legal/trademark search',
  'The most visible expression of your product''s brand positioning is its name. We will conduct workshops and ideation sessions to identify the richest naming territories. From groups of possibilities, we will refine the consideration set together with stakeholders until that one perfect, ownable name is achieved.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-06', false, 'Content planning', 'Vision', '2-3 weeks', 10, 10, 15,
  'Content Strategy', '', '',
  'Your experience needs to keep users coming back. When they do, they must engage with fresh content. We will plan during and beyond the launch to create a calendar that addresses each content category, so you can keep the experience current and relevant over time. We will work with your internal teams to ensure that the cadence of content is feasible, and/or identify content that should be created externally.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-07', false, 'Content migration', 'Vision', 'TBD', 10, 10, 20,
  'Content Strategy', 'Product Management', '',
  'In planning our new experience, we will determine which existing content to migrate or not. This will ensure we are maximizing previous content efforts to deliver on goals.

We will identify highly functional or engaging content for transfer into the new experience by categorizing it for preservation, edit, or reassignment. We will also give guidance on how to apply governance for content distribution in the new experience.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-08', false, 'Launch communication strategy', 'Vision', '2-4 weeks', 10, 10, 20,
  'Content Strategy', '', '',
  'It''s critical to communicate and connect effectively with your audience at launch. It''s important to know precisely what to say to which audiences to ensure maximum impact.

Steered by our goals for ongoing success, we will identify what messages will best engage different audiences across channels. We will ensure that a communication strategy is aligned with any launch events that are important to your organization.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-09', false, 'Post-launch communication strategy', 'Vision', '2-4 weeks', 10, 10, 20,
  'Content Strategy', '', '',
  'Ensuring user engagement with an experience post-launch means ensuring your content creators know how to create the right content for the right users on the right channels. Your post-launch communication strategy will help ensure that creative resources are assigned efficiently. We will craft a guide for where, when, and what to post across your owned and/or social channels. We will identify creators, and recommend formats, topics, and potential partnerships.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-10', false, 'Experience principles', 'Vision', '1 week', 5, 5, 5,
  'UX', 'UI/Content', '',
  'We will work with your team to identify the core experiential principles that our experience will embody. This will provide a North Star for all future work to hold true to. Depending on the approach that we decide to take together, this could include:
- Visual design principles
- Functional principles
- Accessibility principles
- Content principles'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-11', false, 'Think Beyond Workshop', 'Vision', '3-4 days', 3, 3, 4,
  'Project DRI', 'All disciplines',
  'This activity requires 2-3 days of prep followed by 1-2 days of workshopping. If remote best to break up workshop into 2 days',
  'During our Think Beyond workshop, we will ideate together. We will use "How might we?" questions to help us think about novel solutions to problems and insights gleaned in the Insight phase.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-12', false, 'Concept synthesis', 'Vision', '2-3 days', 2, 2, 3,
  'UX', '', '',
  'After the Think Beyond workshop, Fantasy will need time to collate, edit and synthesize the feature concepts.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-13', false, 'Concept card creation', 'Vision', '3 days - 1 week', 3, 3, 5,
  'UX', 'Content/UI', '',
  'The UX team will generate concept cards to represent the key feature/product ideas for testing. Concept cards typically have a textual description of each feature idea as well as a visual representation to help illustrate the idea.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-14', false, 'User validation / Desirability testing', 'Vision', '4 weeks', 20, 20, 20,
  'Research and Insights', '',
  'This activity requires 1 week of research planning, 1 week of recruitment, 1 week of testing and 1 week of synthesis.',
  'We will conduct qualitative desirability testing to ensure that our proposed product solution and features offer a compelling value proposition to our intended audience. We will validate:
- User journeys
- Feature desirability
- The alignment of proposed features with product strategy and vision'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-15', false, 'Technical Validation', 'Vision', '1 week', 5, 5, 5,
  'Product Management', 'Technical vendor',
  'A client''s technical team needs to be involved at this point in the process to be able to evaluate our ideas. A technical vendor may also help to advise of the feasibility of our feature concepts.',
  'Tech teams should be brought along in our process from the very beginning. That said, we know that bandwidth and availability can sometimes be an issue. No matter what, though, tech partners should join us from the start of the Execution phase to validate our design work. We highly recommend including technology in our weekly design reviews.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-16', false, 'Stakeholder Validation', 'Vision', '1 week', 5, 5, 5,
  'UX', 'All disciplines',
  'Fantasy should be looking to understand if any of the feature ideas are not viable from a business standpoint. If we only uncover whether or not our clients "like" our ideas, we haven''t completed the stakeholder validation task.',
  'We''ll meet with key stakeholders to ensure a deep understanding of and buy-in to the Vision across the organization. This will help to:
- Align expectations and promote a sense of joint ownership
- Encourage collaboration between departments/siloed functions of the organization
- Establish a clear foundation and common goals for decision-making going forwards'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-17', false, 'Feature Prioritization', 'Vision', '2-3 days', 2, 2, 3,
  'Product Management', 'UX',
  'UX may run this activity if Product Management is not on the project',
  'We will align on which features match our overall vision across the experience, business, brand, users and tech to identify which to focus on during the Execute phase based on certain criteria. We''ll ask questions such as:
- Is it a Desirable solution for users?
- Is it Feasible from a technical perspective?
- Will it provide a Viable contribution to the business?

We will typically use tools such as 2x2s to map these elements against one another.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-18', false, 'Future user journey / Ideal user journey', 'Vision', '2 weeks', 10, 10, 10,
  'UX', 'All disciplines',
  'The duration of this activity should be determined based on the complexity of the product AND the need to reviews/revise with the client before finalizing.',
  'We will concept and develop a future user journey that demonstrates how an ideal user experience can be brought to life across all relevant touch points.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-19', false, 'Storyboarding', 'Vision', 'TBD', 5, 5, 10,
  'UX', 'Content',
  'Storyboarding is sometimes used as an alternative to the "Future user journey" activity',
  'Storyboards are used to visualize a designed sequence. We will create storyboards to showcase the key sequences of the experience before moving them further into more refined design.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-20', false, 'Measurement Strategy and Success Framework', 'Vision', '1-2 weeks', 5, 5, 10,
  'Data Science', '', '',
  'We will work with you to develop measurement strategies that integrate hard business KPIs with CX measures so we have a balanced, holistic approach to measuring success.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-21', false, 'Visual design direction', 'Vision', '2-3 weeks', 10, 10, 15,
  'UI', 'UX/Motion', '',
  'From our concepts, we will define and document a flexible visual design foundation that will be used to build out the final experience. This will include:
- Typographic principles and standards
- Color systems
- Use of imagery
- Use of motion and animation'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-22', false, 'Prototype', 'Vision', '2-6 weeks', 10, 10, 30,
  'UX', 'UI',
  'Prototype complexity can vary based on client needs/expectations. Simple prototypes can be made in Figma using a UX designer. More complex, HTML prototypes will require a specialized resource.',
  'Fantasy may create a low-fidelity or high-fidelity prototype. A high-fidelity prototype leverages advanced prototyping programs and/or actual front-end code to closely resemble the final, developed product.

A simple prototype is an efficient way to convey ideas and get feedback quickly, from the early stages of UX all the way through to Visual and Motion Design. Simple clickable prototypes can be made with paper sketches, design tools like InVision or Figma, or even in Keynote, and typically display a flow or interaction.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-23', false, 'Vision Video', 'Vision', '2-4 weeks', 10, 10, 20,
  'Motion', 'UI/Content',
  'Dependent on level of fidelity of video, music, voiceover, typography, story vs a bunch of features, etc',
  'A vision video is used to visually communicate a future product into a cohesive story typically painted in the eyes of a user. These videos help greatly with internal alignment, external buzz, and can also act as a crucial stepping point to creating/executing a brand new product experience.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-24', false, 'Sitemap, Navigation, UX Framework', 'Vision', '2-4 weeks', 10, 10, 20,
  'UX', 'Content',
  'Typically Sitemap, Navigation and UX Framework are worked on simultaneously over a 2-3 week period',
  'Providing a foundation for the entire experience, a sitemap will help us to visualize all the templates and scenarios for which we''ll design, and a progressive rollout strategy. We will use it to:
- Establish the organization of product content
- Establish content relationships
- Determine our phased design approach'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-25', false, 'Template definition', 'Vision', '1 week', 5, 5, 5,
  'UX', 'Content/Product',
  'Defining your product templates can help you plan for an Execution phase of work.',
  'Next, we''ll identify what templates need to be created for our experience, and then define their characteristics. These templates will be comprised of reusable pieces, including modules, components, and other elements.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-26', false, 'Product Roadmap', 'Vision', '1-2 weeks', 5, 5, 10,
  'Product Management', 'UX', '',
  'We will create a high-level visual summary which outlines the product strategy to execute on our vision over time. Depending on the approach we decide to take together, we will map out:
- Key themes, epics, and core features
- Release timing
- Infrastructure and capabilities
- Organizational readiness
- Integrations and testing'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-27', false, 'Requirements gathering for Sprint 1', 'Vision', '1-2 weeks', 5, 5, 10,
  'Product Management', 'UX', '',
  'For each part of the experience, we will ensure we have gathered all the requisite requirements from stakeholders, enabling us to build a clear picture of how to successfully create the experience itself. In order to confidently begin the execute phase, Product Managers should work with our internal UX and the client team to make sure we have comprehensive requirements for our first sprint.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-28', false, 'Operational Model', 'Vision', '1-2 weeks', 5, 5, 10,
  'Production', 'Product', '',
  'Include the documentation of:
- Sprint cadence
- "Definition of done" for tech handover
- Requirements documentation expectations
- Approval process
- Feedback process'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-29', false, 'MVP Definition', 'Vision', '1-2 weeks', 5, 5, 10,
  'Product Management', 'Production/UX',
  'Needs to be done in partnership with technical team',
  'MVP definition is typically conducted by Product Management and should go hand in hand with a Product Roadmap. The MVP will need to be defined in collaboration with a technical team.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-30', false, 'Bluesky visual concept development', 'Vision', '2-3 weeks', 10, 10, 15,
  'UI', '', '',
  'Fantasy will provide a series of design explorations to show the new or evolved product design.'
);

insert into activities (id, in_by_default, name, phase, duration, duration_days, duration_days_min, duration_days_max, owner, contributors, scoping, description) values (
  'vision-31', false, 'Baseline design system', 'Vision', '2-3 weeks', 10, 10, 15,
  'UI', 'UX/Product', '',
  'Fantasy will generate a series of sharable components that express the new design language for the product experience. These components will be used to create visual design in the Execute phase.'
);
