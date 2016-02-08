/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
`use strict`;

const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH;
const CIRCLE_PROJECT_USERNAME = process.env.CIRCLE_PROJECT_USERNAME;
const CIRCLE_PROJECT_REPONAME = process.env.CIRCLE_PROJECT_REPONAME;
const CIRCLE_COMPARE_URL = process.env.CIRCLE_COMPARE_URL;
const CI_PULL_REQUESTS = process.env.CI_PULL_REQUESTS;
const CI_PULL_REQUEST = process.env.CI_PULL_REQUEST;
const CIRCLE_USERNAME = process.env.CIRCLE_USERNAME;

// TODO temp
const remoteBranch = 'git://github.com/bestander/react-native.git';
require(`shelljs/global`);

if (!which(`git`)) {
  echo(`Sorry, this script requires git`);
  exit(1);
}

let version;
if (branch.indexOf(`-stable`) !== -1) {
  version = CIRCLE_BRANCH.slice(0, branch.indexOf(`-stable`));
}

console.log({
  CIRCLE_BRANCH,
  CIRCLE_PROJECT_USERNAME,
  CIRCLE_PROJECT_REPONAME,
  CIRCLE_COMPARE_URL,
  CI_PULL_REQUESTS,
  CI_PULL_REQUEST,
  CIRCLE_USERNAME,
  version
});

if (exec(`node ./server/generate.js`).code !== 0) {
  echo(`Error: Generating HTML failed`);
}

if (!isPullRequest && isTravis && version) {
  echo(`Building stable branch ${version}, preparing to push to gh-pages`);
  // if code is running in a branch in CI, commit changes to gh-pages branch
  cd(`build`);
  rm(`-rf`, `react-native-gh-pages`);

  if (exec(`git clone ${remoteBranch} react-native-gh-pages`).code !== 0) {
    echo(`Error: Git clone failed`);
    exit(1);
  }

  cd(`react-native-gh-pages`);

  const checkoutCode = exec(`git checkout origin/gh-pages`).code;
  checkoutCode += exec(`git checkout -b gh-pages`).code;
  checkoutCode += exec(`git branch --set-upstream-to=origin/gh-pages`).code;

  if (checkoutCode !== 0) {
    echo(`Error: Git checkout gh-pages failed`);
    exit(1);
  }

  rm(`-rf`, `releases/${version}`);
  mkdir(`-p`, `releases/${version}`);
  exec('cp -R ../react-native/* releases/${version}');
  exec(`cp ../../../circle.yml .`);

  exec(`git status`);
  exec(`git add -A .`);
  if (exec(`git diff-index --quiet HEAD --`).code !== 0) {
    const checkInCode = exec(`git commit -m "update website"`).code;
//    checkInCode += exec(`git push origin gh-pages`).code;
    if (checkInCode !== 0) {
      echo(`Error: Git checkout gh-pages failed`);
      exit(1);    
    }
  }
}
