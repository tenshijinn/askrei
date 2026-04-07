export interface PresetCategory {
  name: string;
  prompts: string[];
}

export const talentPresets: PresetCategory[] = [
  {
    name: "JOB SEARCH",
    prompts: [
      "find me web3 jobs matching my skills",
      "show remote blockchain dev positions",
      "looking for defi opportunities",
      "entry-level web3 roles"
    ]
  },
  {
    name: "TASKS",
    prompts: [
      "show available web3 tasks",
      "find quick bounties",
      "smart contract auditing tasks",
      "show me tasks matching my skills"
    ]
  },
  {
    name: "POST JOB",
    prompts: [
      "I want to post a job",
      "create a job listing",
      "hire for a web3 position"
    ]
  },
  {
    name: "POST TASK",
    prompts: [
      "post a task or bounty",
      "list a new task",
      "create a bounty"
    ]
  },
  {
    name: "CONTRIBUTE",
    prompts: [
      "I found a job to share",
      "submit opportunity I found",
      "contribute a job posting",
      "share a task I discovered"
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
