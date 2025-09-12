<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service M2 API - README</title>
</head>
<body>

  <h1>🚀 Service M2 API</h1>
  <p>Backend built with <strong>NestJS</strong>, ready for development, automatic versioning, and AWS deployment.</p>

  <hr>

  <h2>📦 Requirements</h2>
  <ul>
    <li>Node.js v22+</li>
    <li>npm v10+</li>
    <li>Docker (for builds and deployments)</li>
  </ul>

  <h2>🛠️ Local Development</h2>
  <ol>
    <li>
      Install dependencies:
      <pre><code>npm install</code></pre>
    </li>
    <li>
      Start in development mode:
      <pre><code>npm run start:dev</code></pre>
    </li>
    <li>
      Build the project:
      <pre><code>npm run build</code></pre>
    </li>
    <li>
      Run the build:
      <pre><code>npm run start:prod</code></pre>
    </li>
  </ol>

  <h2>🐳 Docker</h2>
  <h3>Build locally</h3>
  <pre><code>docker build -t service-m2 .</code></pre>

  <h3>Run locally</h3>
  <pre><code>docker run -p 3000:3000 service-m2</code></pre>

  <h2>🔀 Commits &amp; Versioning</h2>
  <p>We follow <strong>Conventional Commits</strong> so that versioning is handled automatically.</p>

  <p>Examples:</p>
  <ul>
    <li><code>feat(api): add user endpoints</code></li>
    <li><code>fix(auth): handle expired tokens</code></li>
    <li><code>chore(deps): update eslint config</code></li>
  </ul>

  <p>👉 If you don’t follow the convention, the commit will be rejected by <strong>husky + commitlint</strong>.</p>

  <h2>🧹 Linting &amp; Tests</h2>
  <p>Run lint:</p>
  <pre><code>npm run lint</code></pre>

  <p>Run tests:</p>
  <pre><code>npm test</code></pre>

  <p>⚡ <strong>Pre-commit hooks</strong> automatically run lint and tests,<br>
  but commits will <strong>not be blocked if tests are missing or failing</strong>.</p>

  <h2>🚀 Deployment</h2>
  <p>Deployment is done via a <strong>Docker multi-stage build</strong> on AWS.<br>
  The runtime starts with:</p>
  <pre><code>node dist/main.js</code></pre>

  <h2>📖 Developer Notes</h2>
  <ul>
    <li>Always use <code>feat</code>, <code>fix</code>, <code>chore</code>, <code>refactor</code>, etc. in your commits.</li>
    <li>Version tags (<code>dev-x.y.z</code>) are generated automatically.</li>
    <li><code>dist/</code> should <strong>never</strong> be committed; it’s generated during the build.</li>
  </ul>

</body>
</html>

