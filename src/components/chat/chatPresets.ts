export interface PresetCategory {
  name: string;
  prompts: string[];
}

export const talentPresets: PresetCategory[] = [
  {
    name: "BOUNTIES",
    prompts: [
      "find bounties matching my skills",
      "show me open bounties",
      "highest paying bounties right now",
      "quick bounties I can finish this week"
    ]
  },
  {
    name: "TASKS & QUESTS",
    prompts: [
      "show available tasks and quests",
      "find quests I can complete",
      "smart contract auditing tasks",
      "design tasks for web3 projects"
    ]
  },
  {
    name: "POST TASK",
    prompts: [
      "post a task or bounty",
      "list a new bounty",
      "create a quest"
    ]
  },
  {
    name: "CONTRIBUTE",
    prompts: [
      "I found a bounty to share",
      "submit an opportunity I found",
      "contribute a task I discovered",
      "share a quest with the community"
    ]
  },
  {
    name: "JOBS",
    prompts: [
      "show web3 jobs matching my skills",
      "remote blockchain dev roles",
      "entry-level web3 jobs"
    ]
  },
  {
    name: "MY PROFILE",
    prompts: [
      "check my points",
      "show submission history",
      "view my stats",
      "how many points do I have"
    ]
  }
];

export const employerPresets: PresetCategory[] = [
  {
    name: "FIND TALENT",
    prompts: [
      "find react devs with web3 exp",
      "show solidity experts",
      "frontend dev familiar with defi",
      "designers with nft experience"
    ]
  },
  {
    name: "POST JOB",
    prompts: [
      "post a job opening",
      "list a full-time position",
      "hire for a role"
    ]
  },
  {
    name: "POST TASK",
    prompts: [
      "post a task or bounty",
      "list a contract gig",
      "create a one-off task"
    ]
  },
  {
    name: "BROWSE",
    prompts: [
      "show top talent",
      "browse developers",
      "find verified web3 pros"
    ]
  }
];

export const getPresetsForMode = (mode: 'talent' | 'employer'): PresetCategory[] => {
  return mode === 'talent' ? talentPresets : employerPresets;
};

export const getWelcomePresets = (mode: 'talent' | 'employer'): string[] => {
  const presets = getPresetsForMode(mode);
  return presets.map(category => category.prompts[0]);
};
