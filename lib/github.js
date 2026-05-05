const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export function parseRepoUrl(url) {
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL. Use format: https://github.com/owner/repo");
  return { owner: match[1], repo: match[2] };
}

export async function fetchRepoData(owner, repo) {
  const headers = getHeaders();

  // 1. Basic repo info
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  if (repoRes.status === 404) throw new Error("Repository not found. Make sure it's public.");
  if (repoRes.status === 403) throw new Error("GitHub rate limit hit. Please add a GitHub token.");
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repoInfo = await repoRes.json();

  // 2. README
  let readme = "No README found.";
  let readmeLength = 0;
  try {
    const readmeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      const decoded = Buffer.from(readmeData.content, "base64").toString("utf-8");
      readmeLength = decoded.length;
      readme = decoded;
    }
  } catch (_) {}

  // 3. Root file structure
  let fileTree = [];
  try {
    const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents`, { headers });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      fileTree = Array.isArray(treeData)
        ? treeData.map((f) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`)
        : [];
    }
  } catch (_) {}

  // 4. Dependency file
  let dependencyFile = null;
  let dependencyFileName = null;
  const depFiles = ["package.json", "requirements.txt", "Pipfile", "go.mod", "pom.xml", "Cargo.toml"];
  for (const fname of depFiles) {
    try {
      const depRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${fname}`, { headers });
      if (depRes.ok) {
        const depData = await depRes.json();
        dependencyFile = Buffer.from(depData.content, "base64").toString("utf-8").slice(0, 2000);
        dependencyFileName = fname;
        break;
      }
    } catch (_) {}
  }

  // 5. Last 30 commits
  let commits = [];
  try {
    const commitsRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=30`, { headers });
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      commits = commitsData.map((c) => ({
        message: c.commit.message.split("\n")[0].slice(0, 120),
        date: c.commit.author.date,
        author: c.commit.author.name,
      }));
    }
  } catch (_) {}

  // 6. Languages
  let languages = {};
  try {
    const langRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers });
    if (langRes.ok) languages = await langRes.json();
  } catch (_) {}

  // 7. Test signals
  const testSignals = fileTree.filter((f) =>
    /(test|spec|__tests__|jest|vitest|pytest|cypress)/i.test(f)
  );

  // 8. Red flags from metadata
  const redFlags = [];
  if (!fileTree.some((f) => f.includes(".gitignore"))) redFlags.push("No .gitignore file");
  if (readme === "No README found.") redFlags.push("No README");
  if (!repoInfo.license) redFlags.push("No license");
  if (
    repoInfo.open_issues_count === 0 &&
    repoInfo.forks_count === 0 &&
    repoInfo.stargazers_count === 0
  )
    redFlags.push("No community engagement (0 stars, forks, issues)");

  // Commit burst detection
  if (commits.length >= 5) {
    const firstDate = new Date(commits[commits.length - 1].date);
    const lastDate = new Date(commits[0].date);
    const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    if (daySpan < 2 && commits.length > 10)
      redFlags.push("All commits pushed in under 2 days — likely a one-time upload");
  }

  return {
    repoInfo: {
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      language: repoInfo.language,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      openIssues: repoInfo.open_issues_count,
      createdAt: repoInfo.created_at,
      updatedAt: repoInfo.updated_at,
      pushedAt: repoInfo.pushed_at,
      size: repoInfo.size,
      hasWiki: repoInfo.has_wiki,
      topics: repoInfo.topics || [],
      defaultBranch: repoInfo.default_branch,
    },
    readme,
    readmeLength,
    fileTree,
    dependencyFile,
    dependencyFileName,
    commits,
    languages,
    testSignals,
    redFlags,
  };
}
