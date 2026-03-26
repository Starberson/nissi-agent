import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { version = '1.0.0', message = 'Electron agent build' } = body;

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return Response.json({ error: 'Invalid version format. Use semantic versioning (e.g., 1.0.0)' }, { status: 400 });
    }

    const repoUrl = 'https://github.com/Starberson/nissi-agent.git';
    const repoName = 'nissi-agent';
    const owner = 'Starberson';
    const tag = `v${version}`;

    // Get GitHub token from environment
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) {
      return Response.json({
        error: 'GitHub token not configured',
        message: 'Please set GITHUB_TOKEN in Base44 environment variables',
        docs: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens'
      }, { status: 500 });
    }

    // Check if tag already exists
    const checkTagResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/tags/${tag}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (checkTagResponse.ok) {
      return Response.json({
        success: false,
        error: `Tag ${tag} already exists`,
        message: 'Use a different version number or delete the existing tag on GitHub'
      }, { status: 409 });
    }

    // Get latest commit SHA
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!commitResponse.ok) {
      return Response.json({
        error: 'Failed to fetch repository commits',
        details: await commitResponse.text()
      }, { status: 500 });
    }

    const commits = await commitResponse.json();
    if (!commits.length) {
      return Response.json({
        error: 'No commits found in repository',
        message: 'Push code to GitHub first before creating a release'
      }, { status: 400 });
    }

    const latestCommitSha = commits[0].sha;

    // Create git tag (lightweight tag that triggers GitHub Actions)
    const createTagResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/tags/${tag}`,
          sha: latestCommitSha
        })
      }
    );

    if (!createTagResponse.ok) {
      const errorData = await createTagResponse.json();
      return Response.json({
        error: 'Failed to create git tag',
        details: errorData
      }, { status: 500 });
    }

    // Log the action
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `NISSI Electron Build Triggered - ${tag}`,
      body: `Your GitHub Actions workflow has been triggered for version ${version}.\n\nBuilds for Windows, macOS, and Linux will be created and published to GitHub Releases.\n\nWatch the progress: https://github.com/${owner}/${repoName}/actions`
    });

    return Response.json({
      success: true,
      message: `Git tag ${tag} created successfully`,
      version,
      tag,
      commit: latestCommitSha.substring(0, 7),
      buildStatus: 'pending',
      workflowUrl: `https://github.com/${owner}/${repoName}/actions`,
      releaseUrl: `https://github.com/${owner}/${repoName}/releases/tag/${tag}`,
      estimatedTime: '10-15 minutes',
      builds: ['Windows (.exe)', 'macOS (.dmg)', 'Linux (.AppImage, .deb)']
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});