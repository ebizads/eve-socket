export default {
    branches: [
        { name: 'dev/test', prerelease: 'dev' }, // Pre-release branch — bumps version but doesn't publish full release
        { name: 'master' } // Production release branch
    ],
    plugins: [    
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'conventionalcommits',
                releaseRules: [
                    { type: 'breaking', release: 'major' }, // custom "breaking" type bumps major
                    { type: 'feat', release: 'minor' },     // features bump minor
                    { type: 'fix', release: 'patch' },      // fixes bump patch
                    { type: 'docs', release: false },       // no release for docs changes
                    { type: 'style', release: 'patch' },    // style bump patch 
                    { type: 'refactor', release: 'patch' }, // refactors bump patch
                    { type: 'perf', release: 'minor' },     // performance bumps minor
                    { type: 'test', release: 'patch' },     // performance bumps minor
                    { type: 'chore', release: false },      // no release for chores 
                ]
            }
        ],
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        ["@semantic-release/git", {
            assets: ['CHANGELOG.md'],
            message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}' //creates a commit message "chore" that pushes the commit doesnt affect the version, skip ci commit does not trigger workflow triggered by push events 
        }],
        '@semantic-release/github'
    ]
}

