interface GitHubTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
}

interface GitHubUser {
  readonly id: number;
  readonly login: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly avatar_url: string;
}

interface GitHubEmail {
  readonly email: string;
  readonly primary: boolean;
  readonly verified: boolean;
}

export interface GitHubProfile {
  readonly githubId: number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string;
}

export function buildGitHubAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = (await response.json()) as GitHubTokenResponse;
  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  return data.access_token;
}

export async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const [userResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user profile');
  }

  const user = (await userResponse.json()) as GitHubUser;

  let email = user.email;
  if (!email && emailsResponse.ok) {
    const emails = (await emailsResponse.json()) as GitHubEmail[];
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary?.email ?? emails[0]?.email ?? null;
  }

  if (!email) {
    throw new Error('No email found in GitHub profile');
  }

  return {
    githubId: user.id,
    name: user.name ?? user.login,
    email,
    avatarUrl: user.avatar_url,
  };
}
