// Activity Database — pre-built activities with timing, ownership, and descriptions.
// Schema matches the Activity Database Template (Excel).
// durationDays: [min, max] working days parsed from "Standard Duration" column.

const activityDatabase = [
  // ─── INSIGHT PHASE ───────────────────────────────────────────────
  {
    id: 'insight-01',
    inByDefault: true,
    name: 'Kickoff & Immersion',
    phase: 'Insight',
    duration: '1-5 days',
    durationDays: [1, 5],
    owner: 'Project DRI',
    contributors: 'All disciplines',
    scoping: 'Kickoff are best done in person. If done remotely, you could adjust your kick off approach so that you\'re tackling 2 or 3, 1hr sessions per day over several days.',
    description: `All of our projects begin with collaborative sessions. During this period we'll:
- Understand your experience vision and goals
- Understand your competitors
- Understand your unique differentiators
- Discuss existing brand attributes
- Review existing features and functionality
- Review product and audience research
- Discuss technical limitations and considerations`,
  },
  {
    id: 'insight-02',
    inByDefault: true,
    name: 'Stakeholder Interviews',
    phase: 'Insight',
    duration: '1-3 weeks',
    durationDays: [5, 15],
    owner: 'Project DRI',
    contributors: 'All disciplines',
    scoping: 'Dont skimp on this. The more people we talk to the more it opens up for organic growth convos down the line',
    description: `We'll meet with your stakeholders to identify:
- Key organizational insights
- Key audience insights
- Their roles and responsibilities on this engagement
- Their desires for this engagement, and any risks they can help us identify in its delivery`,
  },
  {
    id: 'insight-03',
    inByDefault: true,
    name: 'High-level business goal and KPI setting',
    phase: 'Insight',
    duration: '1-3 weeks',
    durationDays: [5, 15],
    owner: 'Product Management',
    contributors: 'All disciplines',
    scoping: 'High-level KPIs are often uncovered as part of the stakeholder interview process',
    description: `We will work with senior leadership, stakeholders, and analysts to identify high-level goals and KPIs. As we do this together, we will identify the following for our project:
- The high-level business and goals we must impact
- The KPI metrics we will use to measure our success
- The impact on those metrics, and what will deem us successful`,
  },
  {
    id: 'insight-04',
    inByDefault: true,
    name: 'Organizational capabilities evaluation',
    phase: 'Insight',
    duration: '1-3 weeks',
    durationDays: [5, 15],
    owner: 'Product Management',
    contributors: 'Production',
    scoping: 'Organizational capabilities are often uncovered as part of the stakeholder interview process',
    description: `A great product is only realized by combining vision with the ability to execute on it. Understanding your capabilities allows us to tailor our approach. We will understand your resourcing and skillsets in:
- Strategy and research
- Content strategy and production
- Design and testing
- Development and QA`,
  },
  {
    id: 'insight-05',
    inByDefault: false,
    name: 'Data and measurement tool assessment',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Data Science',
    contributors: '',
    scoping: '',
    description: `We will evaluate the processes, tools, and data sources available for measuring the performance of the future digital experience that we create together. As part of this assessment, we will:
- Map all available data sources, assess how well integrated they are, and evaluate their overall level of quality.
- Audit the measurement tools at our disposal, and assess how well configured they are.
- Assess current reporting and analysis approaches.`,
  },
  {
    id: 'insight-06',
    inByDefault: false,
    name: 'Experience Audit',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'UX',
    contributors: 'Content/UI',
    scoping: 'Less intensive than a heuristic evaluation, Experience Audits are used to understand a client\'s current-state when it comes to their digital properties. The output often includes a summary of areas for opportunity.',
    description: 'Less robust than a Heuristic Evaluation, an Experience Audit captures Fantasy\'s point of view on your current user experience across a single product or digital ecosystem. An experience audit will consider how well your experience is serving the needs of your target audience.',
  },
  {
    id: 'insight-07',
    inByDefault: false,
    name: 'Heuristic evaluation',
    phase: 'Insight',
    duration: '2 weeks',
    durationDays: [10, 10],
    owner: 'UX',
    contributors: 'Content/UI',
    scoping: 'Heuristic evaluations are typically more robust than Experience Audits. Project teams should carefully consider what is necessary for their specific project',
    description: `This is a primary research tool to assess the current state and usability of your experience. It provides an expert, unbiased assessment across a range of established best practices and serves as the basis for recommendations and opportunities to improve your experience. Criteria may include:
- Aesthetics
- Ease of use
- Error prevention
- Consistency
- Help and recovery
- Language/tone of voice`,
  },
  {
    id: 'insight-08',
    inByDefault: false,
    name: 'Existing business model canvas exercise',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Product Management',
    contributors: 'Product Management',
    scoping: '',
    description: `We'll meet with the appropriate stakeholders in your company and use this activity to identify your organization's:
- Problem and vision
- Key metrics
- Cost structure
- Revenue streams
- Customer segments
- Unfair advantage
- Channels
- Unique value proposition`,
  },
  {
    id: 'insight-09',
    inByDefault: false,
    name: 'Technical discovery',
    phase: 'Insight',
    duration: '3-4 weeks',
    durationDays: [15, 20],
    owner: 'Product Management',
    contributors: 'Product Management',
    scoping: 'Fantasy needs to partner with technical vendors to conduct technical discovery',
    description: `We will conduct a holistic analysis of the tech stack, so we understand how it might enable our future digital experience. In this analysis, we will:
- Evaluate the systems, platforms, and middleware that underpin our digital experience.
- Assess how well integrated they are, and check whether any important tools are missing.
- Summarize how our current stack is set up, what it will enable, and where it might need improvement.`,
  },
  {
    id: 'insight-10',
    inByDefault: false,
    name: 'Research Review and Gap Analysis',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Research and Insights',
    contributors: '',
    scoping: 'Production can and should start to compile research materials from the client BEFORE project kick off to help the R&I team to get started on their research review as quickly as possible',
    description: `Building on our research review, we will identify the gaps in current user insights to be filled in order to deliver an effective digital vision. As part of this exercise, we will:
- Identify the core focus areas and themes in the existing user research.
- Map where we need to gather additional insights to deepen our understanding of user needs.
- Make recommendations for further bespoke user research to be conducted as part of our project.`,
  },
  {
    id: 'insight-11',
    inByDefault: false,
    name: 'Landscape Analysis',
    phase: 'Insight',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: 'Content/UI/Product',
    scoping: 'Depending on the project, a landscape analysis can be an internal-facing exercise that helps to inform our Insights and eventual product ideation. However, some projects will require in-depth landscape analysis, in which case you may consider using the high time estimate for the work.',
    description: `Together, we will review a list of competitors and inspirational, out-of-category organizations to identify:
- Content, brand, design and functional characteristics
- Trends relevant to the industry
- Learnings and how we can adapt accordingly`,
  },
  {
    id: 'insight-12',
    inByDefault: false,
    name: 'Future World Analysis',
    phase: 'Insight',
    duration: '1-2 days',
    durationDays: [1, 2],
    owner: 'Data Science',
    contributors: 'UX',
    scoping: 'The data science team requires a brief to understand the goals of the activity. What are we looking to learn? What sources might we want to use in our research?',
    description: `Using our comprehensive sources for market activity & patent filings, we are able to turn complexity into clarity and show you what's just around the corner, enabling you to:
- Get an actionable view of what's around the corner.
- Spot emerging trends and patterns across industries
- Distilled down to the most relevant insights and findings
- If desired, chat with our curated data sources via an AI assistant to allow for further analysis`,
  },
  {
    id: 'insight-13',
    inByDefault: false,
    name: 'Strategic SEO assessment',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Data Science',
    contributors: 'Content',
    scoping: '',
    description: `SEO analysis is a great source of insight into why users are visiting your site and what they are hoping to achieve on it. With an SEO assessment, we will:
- Look at the macro trends driving search behavior in a category, and map them to our target personas.
- Analyze how well a site is doing at capturing search intent in the market, relative to competitors.
- Generate SEO/SEM and editorial strategies that will help clients grow exponentially.`,
  },
  {
    id: 'insight-14',
    inByDefault: false,
    name: 'Ecosystem Map',
    phase: 'Insight',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: 'Content/Product',
    scoping: '',
    description: `An ecosystem in UX is a big-picture visualization of the "who, what, when, where, how" of users and brand interactions. It is a tool to help all stakeholders understand the environment in which an experience operates. It includes these elements and shows the exchange of value between:
- Users
- Services
- Devices
- Channels`,
  },
  {
    id: 'insight-15',
    inByDefault: false,
    name: 'Existing functionality baseline',
    phase: 'Insight',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: '',
    scoping: '',
    description: 'Using our landscape and heuristic analysis as a basis, we will document the key features and functionality that exist today. We may also compare how existing functionalities compare to competitors.',
  },
  {
    id: 'insight-16',
    inByDefault: false,
    name: 'Content Audit and Gap Analysis',
    phase: 'Insight',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'Content Strategy',
    contributors: 'Data Science',
    scoping: 'You should split this activities up - ideally at least a week for each, depends on extent of content/project',
    description: `Auditing your existing content not only provides a full picture of what you have, it also generates ideas to evolve your product in the future, while providing a clear plan for content migration and updating. We will comb through your digital ecosystem to categorize and score content, both by traditional metrics (like content type and metadata) and human-centered categories (like message clarity, voice, and action orientation).

A content gap analysis will reveal where your content is falling short against your own goals and the competitive landscape, so we can create a forward-looking content system. We will chart the content audit alongside your target user personas to determine which content types, topics, or formats are underrepresented, and which are missing completely.`,
  },
  {
    id: 'insight-17',
    inByDefault: false,
    name: 'Social content performance review',
    phase: 'Insight',
    duration: '3 days - 2 weeks',
    durationDays: [3, 10],
    owner: 'Content Strategy',
    contributors: 'Data Science',
    scoping: 'Option to tie this in with "Voice of the User" - duration varies with amount of channels/posts reviewed',
    description: 'For experiences with goals that include sharing content and social engagement, a review of how your content shows up publicly will help better position your brand for success on some of the highest engagement platforms. Our team will test and review how your content appears and performs outside your owned ecosystem, to help us suggest improvements in both form and substance so your brand is better represented.',
  },
  {
    id: 'insight-18',
    inByDefault: false,
    name: 'Brand health analysis',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Content Strategy',
    contributors: 'Data Science',
    scoping: 'Option to tie this in with "Voice of the User" to get user opinions on brand',
    description: 'A careful comparison of how your brand is perceived against your stated brand values and key competitors is crucial to creating unique, cohesive content that delivers on short- and long-term goals. We will review your organization\'s mission, vision, and digital brand expressions, analyzing how they function in the market. Our analysis will provide a clear path for making informed, on-brand choices for content, messaging, and the experience as a whole.',
  },
  {
    id: 'insight-19',
    inByDefault: false,
    name: 'Quantified user journeys',
    phase: 'Insight',
    duration: '2 weeks',
    durationDays: [10, 10],
    owner: 'Research and Insights',
    contributors: '',
    scoping: 'Best used for product-redesign projects. Less useful for 0-1 product design.',
    description: `The job of a quantified user journey is to visualize how people interact with your experience today, and where the biggest opportunities for improvement and innovation can be found. To gather the data for this, we will complement qualitative discovery with quantitative surveys that:
- Measure the importance of different jobs to be done to our users.
- Quantify usage of touch points and the size of the pain points that users have.
- Measure where, across their journey, they are experiencing the most friction that we can solve through design.`,
  },
  {
    id: 'insight-20',
    inByDefault: false,
    name: 'Current state user journey',
    phase: 'Insight',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: '',
    scoping: '',
    description: `A current state user journey will visualize the experience that users are having today when they are interacting with your experience. It will cover:
- Key stages of their current journey
- Goals and tasks they are trying to achieve at each stage of their journey
- How they are feeling during each stage
- Pain points they experience during each stage
- Ecosystem touch points that users are engaging with and using during each stage`,
  },
  {
    id: 'insight-21',
    inByDefault: false,
    name: 'Storytelling workshop',
    phase: 'Insight',
    duration: '1 day',
    durationDays: [1, 1],
    owner: 'Research and Insights',
    contributors: 'All disciplines',
    scoping: '',
    description: `Once we have gathered insights into our users, we will run energizing workshops to story-tell our insights, and identify innovation opportunities together. In these, we will:
- Tell stories about the users we have met, and share the key insights we gathered from them.
- Create key insight themes that can form the basis of future innovation opportunities.
- Generate initial solution hunches for what our future experience can do to solve audience needs.`,
  },
  {
    id: 'insight-22',
    inByDefault: false,
    name: 'Behavioral analytics',
    phase: 'Insight',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Data Science',
    contributors: 'UX/Product Management',
    scoping: 'UX and Product Management to identify specific questions that we would like to be answered via the Behavioral Analytics analysis.',
    description: `We will conduct bespoke behavioral analytics to get a deeper understanding of how our users are behaving within our digital experience and set benchmark metrics for us to improve. This will involve analyzing:
- Engagement with sections and features within the experience to identify which ones need improvement
- The user segments we engage with most, and the user segments we need to engage with more in the future
- The typical flows that users take through the experience, and where they are experiencing moments of friction that need to be alleviated`,
  },
  {
    id: 'insight-23',
    inByDefault: false,
    name: 'CX analytics',
    phase: 'Insight',
    duration: '2-5 weeks',
    durationDays: [10, 25],
    owner: 'Data Science',
    contributors: 'Research and Insights/Product Management',
    scoping: '',
    description: `CX analytics will help us understand and further identify improvements that we can make to the experience. We will:
- Conduct intercept CX polls to capture user feedback and identify potential improvement areas.
- Leverage heat maps and scroll maps to spot opportunities for page optimization.
- Use session recordings to see how users are traveling through a site and where they are having issues.`,
  },
  {
    id: 'insight-24',
    inByDefault: false,
    name: 'Audience research',
    phase: 'Insight',
    duration: '4-6 weeks',
    durationDays: [20, 30],
    owner: 'Research and Insights',
    contributors: '',
    scoping: 'There are 4 distinct steps to initial audience research: Research plan development, recruitment, testing, and analysis. Each step takes approx. 1 week and requires time for an Insights Coordinator as well as an Insights Lead/Sr.',
    description: 'Research and Insights should be consulted to identify which methodology is appropriate for the first round of audience research.',
  },
  {
    id: 'insight-25',
    inByDefault: false,
    name: 'Mobile ethnography',
    phase: 'Insight',
    duration: 'TBD',
    durationDays: [5, 10],
    owner: 'Research and Insights',
    contributors: '',
    scoping: '',
    description: `Mobile ethnography will capture in-the-moment, contextual insights that uncover innovation opportunities for our future experience. Over the course of a few days, participants will use an app on their phones to:
- Go through a user journey and highlight their needs, behaviors, and pain points at every step.
- Deliver picture-in-picture recordings of themselves using the current experience, showing where they are experiencing moments of friction.`,
  },
  {
    id: 'insight-26',
    inByDefault: false,
    name: 'Online community',
    phase: 'Insight',
    duration: 'TBD',
    durationDays: [10, 20],
    owner: 'Research and Insights',
    contributors: '',
    scoping: '',
    description: `Online communities are a consistent, dedicated, and available group of users that can to co-create with us end-to-end in a project. By having a dedicated online community, we will be able to:
- Invite users to document and prioritize their most important needs from the future experience.
- Request users to co-create the future experience together with us.
- Test out the desirability of early concepts and prototypes to make sure they meet our users' needs.
- Conduct usability testing on our designs to ensure they are easy to use.`,
  },
  {
    id: 'insight-27',
    inByDefault: false,
    name: 'In-depth interviews',
    phase: 'Insight',
    duration: 'TBD',
    durationDays: [5, 10],
    owner: 'Research and Insights',
    contributors: '',
    scoping: '',
    description: `We will conduct in-depth user interviews to uncover opportunities for innovation, and illuminate problem areas to solve. In these interviews, we will:
- Explore and understand our users' overall motivations and needs.
- Map the end-to-end user journey, and identify opportunities for innovation.
- Uncover pain points that users are having with the current state experience.`,
  },
  {
    id: 'insight-28',
    inByDefault: false,
    name: 'Immersive insight safaris',
    phase: 'Insight',
    duration: 'TBD',
    durationDays: [5, 10],
    owner: 'Research and Insights',
    contributors: '',
    scoping: '',
    description: `Insight safaris involve observing and interviewing users in real-life environments. Our insight safari will help us to design a more compelling solution by enabling us to:
- Understand the cultural context of the users we are designing for.
- Observe users' real behavior within the places they will be using our experience.
- Tag along with people to observe the day-to-day routines our future experience needs to serve.
- Capture videos and photos that will bring user needs to life and inspire our designers.`,
  },
  {
    id: 'insight-29',
    inByDefault: false,
    name: 'User personas',
    phase: 'Insight',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: 'Content/Product Management',
    scoping: 'All depends on the amount of existing research they have to date and if that research has been validated by research',
    description: `Personas help to summarize the key user needs, experiences, behaviors, and goals you need to serve each of your priority audiences. They usually cover:
- Personal life goals, behaviors and motivations that our product can tap into
- The core needs or "Jobs to Be Done" that this product needs to serve for each of our audience segments
- The pain points or problems that we can solve for each of these audiences`,
  },
  {
    id: 'insight-30',
    inByDefault: false,
    name: 'Insights Synthesis',
    phase: 'Insight',
    duration: '2.5 weeks',
    durationDays: [12, 12],
    owner: 'Research and Insights',
    contributors: 'All disciplines',
    scoping: 'This activity requires .5 weeks to align internally on insights from the landscape, business, experience and users before workshopping our Insights (sometimes called Solution Hypotheses) with the client.',
    description: 'Having gathered rich information from your landscape, experience, business and audience, we will synthesize these learnings into strategic perspectives to inform how we should develop our future product. This summation will give us a clear perspective, as a unified team, on considerations we should hold top of mind as we move into the Vision phase.',
  },

  // ─── VISION PHASE ────────────────────────────────────────────────
  {
    id: 'vision-01',
    inByDefault: false,
    name: 'Brand positioning',
    phase: 'Vision',
    duration: '2 weeks',
    durationDays: [10, 10],
    owner: 'Content Strategy',
    contributors: '',
    scoping: 'Depends on client size and involvement - AI helps with writing',
    description: 'Brand positioning is a holistic picture of how you\'d like your brand to be perceived by customers in relation to competitors. We will break down your target audiences and competitors, and write a positioning statement your brand can use as a North Star, while creating a new experience. Workshopping with key stakeholders, we will collaborate on a brand position that differentiates your new experience in a competitive landscape.',
  },
  {
    id: 'vision-02',
    inByDefault: false,
    name: 'Messaging Strategy',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'Content Strategy',
    contributors: '',
    scoping: 'The optional tagline exploration can take another 2-4 weeks',
    description: 'We will distill your experience\'s most important benefits into core messaging guidelines grounded in your brand attributes. These guidelines will instruct content creators on how to use your brand\'s voice, and engage your audience. We will provide primary and secondary messaging to serve as foundational materials for your organization to help you produce streamlined content and campaign work.',
  },
  {
    id: 'vision-03',
    inByDefault: false,
    name: 'Content Taxonomy',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'Content Strategy',
    contributors: '',
    scoping: '',
    description: 'In order for end users to find and engage with content, you must properly sort, categorize and name how content appears. Together, we will identify categories of content to meet user needs and drive engagement, while also meeting business goals. We will marry strategic organization with tactical examples to ensure you can manage content creation on your own once the experience is up and running.',
  },
  {
    id: 'vision-04',
    inByDefault: false,
    name: 'Brand mission and values',
    phase: 'Vision',
    duration: '2-4 weeks',
    durationDays: [10, 20],
    owner: 'Content Strategy',
    contributors: '',
    scoping: '',
    description: 'Crafting your product\'s brand mission and values ensures that the experience stays focused on the business goals that matter most. Distilling your product\'s core tenets ensures your product is relatable to users, streamlines the creative process, and distinguishes your properties from competitors. Based on stakeholder interviews and ongoing research and analysis, we will distill your product\'s mission statement, core values, and personality traits, and then present them to you for your internal use.',
  },
  {
    id: 'vision-05',
    inByDefault: false,
    name: 'Product naming',
    phase: 'Vision',
    duration: '2+ weeks',
    durationDays: [10, 15],
    owner: 'Content Strategy',
    contributors: 'All disciplines',
    scoping: 'Excludes legal/trademark search',
    description: 'The most visible expression of your product\'s brand positioning is its name. We will conduct workshops and ideation sessions to identify the richest naming territories. From groups of possibilities, we will refine the consideration set together with stakeholders until that one perfect, ownable name is achieved.',
  },
  {
    id: 'vision-06',
    inByDefault: false,
    name: 'Content planning',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'Content Strategy',
    contributors: '',
    scoping: '',
    description: 'Your experience needs to keep users coming back. When they do, they must engage with fresh content. We will plan during and beyond the launch to create a calendar that addresses each content category, so you can keep the experience current and relevant over time. We will work with your internal teams to ensure that the cadence of content is feasible, and/or identify content that should be created externally.',
  },
  {
    id: 'vision-07',
    inByDefault: false,
    name: 'Content migration',
    phase: 'Vision',
    duration: 'TBD',
    durationDays: [10, 20],
    owner: 'Content Strategy',
    contributors: 'Product Management',
    scoping: '',
    description: `In planning our new experience, we will determine which existing content to migrate or not. This will ensure we are maximizing previous content efforts to deliver on goals.

We will identify highly functional or engaging content for transfer into the new experience by categorizing it for preservation, edit, or reassignment. We will also give guidance on how to apply governance for content distribution in the new experience.`,
  },
  {
    id: 'vision-08',
    inByDefault: false,
    name: 'Launch communication strategy',
    phase: 'Vision',
    duration: '2-4 weeks',
    durationDays: [10, 20],
    owner: 'Content Strategy',
    contributors: '',
    scoping: '',
    description: `It's critical to communicate and connect effectively with your audience at launch. It's important to know precisely what to say to which audiences to ensure maximum impact.

Steered by our goals for ongoing success, we will identify what messages will best engage different audiences across channels. We will ensure that a communication strategy is aligned with any launch events that are important to your organization.`,
  },
  {
    id: 'vision-09',
    inByDefault: false,
    name: 'Post-launch communication strategy',
    phase: 'Vision',
    duration: '2-4 weeks',
    durationDays: [10, 20],
    owner: 'Content Strategy',
    contributors: '',
    scoping: '',
    description: 'Ensuring user engagement with an experience post-launch means ensuring your content creators know how to create the right content for the right users on the right channels. Your post-launch communication strategy will help ensure that creative resources are assigned efficiently. We will craft a guide for where, when, and what to post across your owned and/or social channels. We will identify creators, and recommend formats, topics, and potential partnerships.',
  },
  {
    id: 'vision-10',
    inByDefault: false,
    name: 'Experience principles',
    phase: 'Vision',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'UX',
    contributors: 'UI/Content',
    scoping: '',
    description: `We will work with your team to identify the core experiential principles that our experience will embody. This will provide a North Star for all future work to hold true to. Depending on the approach that we decide to take together, this could include:
- Visual design principles
- Functional principles
- Accessibility principles
- Content principles`,
  },
  {
    id: 'vision-11',
    inByDefault: false,
    name: 'Think Beyond Workshop',
    phase: 'Vision',
    duration: '3-4 days',
    durationDays: [3, 4],
    owner: 'Project DRI',
    contributors: 'All disciplines',
    scoping: 'This activity requires 2-3 days of prep followed by 1-2 days of workshopping. If remote best to break up workshop into 2 days',
    description: 'During our Think Beyond workshop, we will ideate together. We will use "How might we?" questions to help us think about novel solutions to problems and insights gleaned in the Insight phase.',
  },
  {
    id: 'vision-12',
    inByDefault: false,
    name: 'Concept synthesis',
    phase: 'Vision',
    duration: '2-3 days',
    durationDays: [2, 3],
    owner: 'UX',
    contributors: '',
    scoping: '',
    description: 'After the Think Beyond workshop, Fantasy will need time to collate, edit and synthesize the feature concepts.',
  },
  {
    id: 'vision-13',
    inByDefault: false,
    name: 'Concept card creation',
    phase: 'Vision',
    duration: '3 days - 1 week',
    durationDays: [3, 5],
    owner: 'UX',
    contributors: 'Content/UI',
    scoping: '',
    description: 'The UX team will generate concept cards to represent the key feature/product ideas for testing. Concept cards typically have a textual description of each feature idea as well as a visual representation to help illustrate the idea.',
  },
  {
    id: 'vision-14',
    inByDefault: false,
    name: 'User validation / Desirability testing',
    phase: 'Vision',
    duration: '4 weeks',
    durationDays: [20, 20],
    owner: 'Research and Insights',
    contributors: '',
    scoping: 'This activity requires 1 week of research planning, 1 week of recruitment, 1 week of testing and 1 week of synthesis.',
    description: `We will conduct qualitative desirability testing to ensure that our proposed product solution and features offer a compelling value proposition to our intended audience. We will validate:
- User journeys
- Feature desirability
- The alignment of proposed features with product strategy and vision`,
  },
  {
    id: 'vision-15',
    inByDefault: false,
    name: 'Technical Validation',
    phase: 'Vision',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'Product Management',
    contributors: 'Technical vendor',
    scoping: 'A client\'s technical team needs to be involved at this point in the process to be able to evaluate our ideas. A technical vendor may also help to advise of the feasibility of our feature concepts.',
    description: 'Tech teams should be brought along in our process from the very beginning. That said, we know that bandwidth and availability can sometimes be an issue. No matter what, though, tech partners should join us from the start of the Execution phase to validate our design work. We highly recommend including technology in our weekly design reviews.',
  },
  {
    id: 'vision-16',
    inByDefault: false,
    name: 'Stakeholder Validation',
    phase: 'Vision',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'UX',
    contributors: 'All disciplines',
    scoping: 'Fantasy should be looking to understand if any of the feature ideas are not viable from a business standpoint. If we only uncover whether or not our clients "like" our ideas, we haven\'t completed the stakeholder validation task.',
    description: `We'll meet with key stakeholders to ensure a deep understanding of and buy-in to the Vision across the organization. This will help to:
- Align expectations and promote a sense of joint ownership
- Encourage collaboration between departments/siloed functions of the organization
- Establish a clear foundation and common goals for decision-making going forwards`,
  },
  {
    id: 'vision-17',
    inByDefault: false,
    name: 'Feature Prioritization',
    phase: 'Vision',
    duration: '2-3 days',
    durationDays: [2, 3],
    owner: 'Product Management',
    contributors: 'UX',
    scoping: 'UX may run this activity if Product Management is not on the project',
    description: `We will align on which features match our overall vision across the experience, business, brand, users and tech to identify which to focus on during the Execute phase based on certain criteria. We'll ask questions such as:
- Is it a Desirable solution for users?
- Is it Feasible from a technical perspective?
- Will it provide a Viable contribution to the business?

We will typically use tools such as 2x2s to map these elements against one another.`,
  },
  {
    id: 'vision-18',
    inByDefault: false,
    name: 'Future user journey / Ideal user journey',
    phase: 'Vision',
    duration: '2 weeks',
    durationDays: [10, 10],
    owner: 'UX',
    contributors: 'All disciplines',
    scoping: 'The duration of this activity should be determined based on the complexity of the product AND the need to reviews/revise with the client before finalizing.',
    description: 'We will concept and develop a future user journey that demonstrates how an ideal user experience can be brought to life across all relevant touch points.',
  },
  {
    id: 'vision-19',
    inByDefault: false,
    name: 'Storyboarding',
    phase: 'Vision',
    duration: 'TBD',
    durationDays: [5, 10],
    owner: 'UX',
    contributors: 'Content',
    scoping: 'Storyboarding is sometimes used as an alternative to the "Future user journey" activity',
    description: 'Storyboards are used to visualize a designed sequence. We will create storyboards to showcase the key sequences of the experience before moving them further into more refined design.',
  },
  {
    id: 'vision-20',
    inByDefault: false,
    name: 'Measurement Strategy and Success Framework',
    phase: 'Vision',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'Data Science',
    contributors: '',
    scoping: '',
    description: 'We will work with you to develop measurement strategies that integrate hard business KPIs with CX measures so we have a balanced, holistic approach to measuring success.',
  },
  {
    id: 'vision-21',
    inByDefault: false,
    name: 'Visual design direction',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'UI',
    contributors: 'UX/Motion',
    scoping: '',
    description: `From our concepts, we will define and document a flexible visual design foundation that will be used to build out the final experience. This will include:
- Typographic principles and standards
- Color systems
- Use of imagery
- Use of motion and animation`,
  },
  {
    id: 'vision-22',
    inByDefault: false,
    name: 'Prototype',
    phase: 'Vision',
    duration: '2-6 weeks',
    durationDays: [10, 30],
    owner: 'UX',
    contributors: 'UI',
    scoping: 'Prototype complexity can vary based on client needs/expectations. Simple prototypes can be made in Figma using a UX designer. More complex, HTML prototypes will require a specialized resource.',
    description: `Fantasy may create a low-fidelity or high-fidelity prototype. A high-fidelity prototype leverages advanced prototyping programs and/or actual front-end code to closely resemble the final, developed product.

A simple prototype is an efficient way to convey ideas and get feedback quickly, from the early stages of UX all the way through to Visual and Motion Design. Simple clickable prototypes can be made with paper sketches, design tools like InVision or Figma, or even in Keynote, and typically display a flow or interaction.`,
  },
  {
    id: 'vision-23',
    inByDefault: false,
    name: 'Vision Video',
    phase: 'Vision',
    duration: '2-4 weeks',
    durationDays: [10, 20],
    owner: 'Motion',
    contributors: 'UI/Content',
    scoping: 'Dependent on level of fidelity of video, music, voiceover, typography, story vs a bunch of features, etc',
    description: 'A vision video is used to visually communicate a future product into a cohesive story typically painted in the eyes of a user. These videos help greatly with internal alignment, external buzz, and can also act as a crucial stepping point to creating/executing a brand new product experience.',
  },
  {
    id: 'vision-24',
    inByDefault: false,
    name: 'Sitemap, Navigation, UX Framework',
    phase: 'Vision',
    duration: '2-4 weeks',
    durationDays: [10, 20],
    owner: 'UX',
    contributors: 'Content',
    scoping: 'Typically Sitemap, Navigation and UX Framework are worked on simultaneously over a 2-3 week period',
    description: `Providing a foundation for the entire experience, a sitemap will help us to visualize all the templates and scenarios for which we'll design, and a progressive rollout strategy. We will use it to:
- Establish the organization of product content
- Establish content relationships
- Determine our phased design approach`,
  },
  {
    id: 'vision-25',
    inByDefault: false,
    name: 'Template definition',
    phase: 'Vision',
    duration: '1 week',
    durationDays: [5, 5],
    owner: 'UX',
    contributors: 'Content/Product',
    scoping: 'Defining your product templates can help you plan for an Execution phase of work.',
    description: 'Next, we\'ll identify what templates need to be created for our experience, and then define their characteristics. These templates will be comprised of reusable pieces, including modules, components, and other elements.',
  },
  {
    id: 'vision-26',
    inByDefault: false,
    name: 'Product Roadmap',
    phase: 'Vision',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'Product Management',
    contributors: 'UX',
    scoping: '',
    description: `We will create a high-level visual summary which outlines the product strategy to execute on our vision over time. Depending on the approach we decide to take together, we will map out:
- Key themes, epics, and core features
- Release timing
- Infrastructure and capabilities
- Organizational readiness
- Integrations and testing`,
  },
  {
    id: 'vision-27',
    inByDefault: false,
    name: 'Requirements gathering for Sprint 1',
    phase: 'Vision',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'Product Management',
    contributors: 'UX',
    scoping: '',
    description: 'For each part of the experience, we will ensure we have gathered all the requisite requirements from stakeholders, enabling us to build a clear picture of how to successfully create the experience itself. In order to confidently begin the execute phase, Product Managers should work with our internal UX and the client team to make sure we have comprehensive requirements for our first sprint.',
  },
  {
    id: 'vision-28',
    inByDefault: false,
    name: 'Operational Model',
    phase: 'Vision',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'Production',
    contributors: 'Product',
    scoping: '',
    description: `Include the documentation of:
- Sprint cadence
- "Definition of done" for tech handover
- Requirements documentation expectations
- Approval process
- Feedback process`,
  },
  {
    id: 'vision-29',
    inByDefault: false,
    name: 'MVP Definition',
    phase: 'Vision',
    duration: '1-2 weeks',
    durationDays: [5, 10],
    owner: 'Product Management',
    contributors: 'Production/UX',
    scoping: 'Needs to be done in partnership with technical team',
    description: 'MVP definition is typically conducted by Product Management and should go hand in hand with a Product Roadmap. The MVP will need to be defined in collaboration with a technical team.',
  },
  {
    id: 'vision-30',
    inByDefault: false,
    name: 'Bluesky visual concept development',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'UI',
    contributors: '',
    scoping: '',
    description: 'Fantasy will provide a series of design explorations to show the new or evolved product design.',
  },
  {
    id: 'vision-31',
    inByDefault: false,
    name: 'Baseline design system',
    phase: 'Vision',
    duration: '2-3 weeks',
    durationDays: [10, 15],
    owner: 'UI',
    contributors: 'UX/Product',
    scoping: '',
    description: 'Fantasy will generate a series of sharable components that express the new design language for the product experience. These components will be used to create visual design in the Execute phase.',
  },
];

export default activityDatabase;

// Helper: get unique phases
export function getPhases() {
  return [...new Set(activityDatabase.map((a) => a.phase))];
}

// Helper: get unique owners
export function getOwners() {
  return [...new Set(activityDatabase.map((a) => a.owner))];
}

// Helper: filter activities
export function filterActivities({ phase, owner, search, defaultOnly } = {}) {
  return activityDatabase.filter((a) => {
    if (phase && a.phase !== phase) return false;
    if (owner && a.owner !== owner) return false;
    if (defaultOnly && !a.inByDefault) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q)
      );
    }
    return true;
  });
}
