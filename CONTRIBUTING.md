## How to contribute to MXCuBE

Before submiting the code to the repository please read these contributing guidelines.
The aim of these guidelines is to help the developers community to maintain the code stable and reusable.

### Reporting bugs

Before submitting a new bug check if the bug is not already reported in the [issues](https://github.com/mxcube/mxcube3/issues/).
If the corresponding issue do not exist then:

- Open a new issue with a short description in the title.
- In the description describe the bug:
  - Conditions when the bug appears.
  - How it can be reproduced.
  - Possible cause of the bug and source code where it occures.
  - If possible add error log and screenshot.
- Assign a label to the issue (see available labels).

### Submiting code to the repository

Pull request (PR) is the most convinient way of submitting a new code to the repository. It helps developers to see the proposed code and publicly review it. To avoid any conflicts in the code base it is important to keep your local git repository syncronized with the latest code in the repository. If repository is checkout out directly then use `git pull` to obtain the latest code from the repository. If a local fork is used then:

- If necessary add link to the upstream repository:

  ```bash
  git remote add upstream https://github.com/mxcube/mxcube3.git
  ```

- Fetch all branches and merge upstream to your forked master:
  ```bash
  git fetch --all
  git checkout master
  git merge upstream/master
  ```

#### Preparing a new commit

- Create a new branch:
  `git checkout -b NEW_BRACH_NAME`
  - If the pull request is associated with an issue then reference the issue in the name. For example:
    `git checkout -b issue_100`
- Edit necessary files, delete existing or add a new file.
- Add files to the staging area:
  `git add ChangedFile1 ChangedFile2`
- Save your new commit to the local repository:
  `git commit`
- Commit command will open a text editor:
  - In the first line write a short commit summary (max 50 characters. It will appear as a title of PR.
  - Add an empty line.
  - Write a longer description.
- Upload the content of the new branch to the remote repository:
  `git push origin NEW_BRACH_NAME`
- Go to the github webpage and create a new PR.

#### Anouncing a new pull request via github webpage

- Go to the project webpage and press "Create pull request".
- Edit information about the PR.
- If needed assign a developer who shall review the PR.

### Accepting a pull request

- The author of a pull request may request a PR review from a certain amount of developers.
- A reviewer can Comment, Approve or Request changes.
- All the assigned reviewers of a PR have to approve the PR before it can be merged.
- The last reviewer to review the PR have the responsibility of merging it.
- A PR that has no reviewer can be approved and merged by anyone.

### Coding style guidelines

It is very important to write a clean and readable code. Therefore we follow the [PEP8 guidelines](https://www.python.org/dev/peps/pep-0008/). Minimal required guidelines are:

- Maximum 88 characters per line.
- Use 4 spaces (not a tab) per identation level.
- Do not use wild (star) imports.
- Used naming styles:
  - lower_case_with_underscores (snake style) for variables, methods.
  - CapitalizedWords for class names.
  - UPPERCASE for constants.
- When catching exceptions, mention specific exceptions whenever possible instead of using a bare except.

You can use [autopep8](https://pypi.org/project/autopep8/) and [black](https://pypi.org/project/autopep8/) to format your code:

```bash
autopep8 -a -r -j 0 -i --max-line-length 88 ./
black --safe ./
```

### Continuous integration (CI)

For continuous integration [Travis](https://travis-ci.org/) is used.

### Additional notes

Issue and Pull request Labels

- bug: indicates a bug in the code. Issue has a highest priority.
- abstract: Abstract class involved. Issue has a hight priority.
- question: general question.
- not used code: suggestion to remove a code block or a file from the repository.
- wip: work in progress
- enchancement: code improvement.

