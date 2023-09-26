## How to contribute to mxcubecore

Before submiting the code to the repository please read these contributing guidlines.
The aim of these guidlines is to help the developers community to maintain the code stable and reusable.

### Reporting bugs
Before submitting a new bug check if the bug is not already reported in the [issues](https://github.com/mxcube/mxcube3/issues/).
If the corresponding issue do not exist then:

* Open a new issue with a short description in the title.
* In the description describe the bug:
    * Conditions when the bug appears.
    * How it can be reproduced.
    * Possible cause of the bug and source code where it occures.
    * If possible add error log and screenshot.
* Assign a label to the issue (see available labels).

### Submiting code to the repository
Pull requests (PR's) are used to submitt new code to the repository, it helps developers to review and dicuss the proposed change. To avoid any conflicts in the code base it is important to keep your local git repository syncronised with the latest code in the upstream repository. If the repository is checked out directly then use `git pull --rebase` to obtain the latest code, if a fork is used then add the offical mxcubecore repository to the list of remotes.

* If necessary add link to the offical mxcubecore repository:

  ```bash
  git remote add upstream git@github.com:mxcube/mxcubecore.git
  ```
  
A branching model based on the popular [gitlfow model](https://nvie.com/posts/a-successful-git-branching-model/) is used inorder to be able to provide versioned releases and at the same time continue seperate development. The stable releases are kept on the [**master**](https://github.com/mxcube/mxcube3/tree/master) branch and the development takes place on [**develop**](https://github.com/mxcube/mxcube3/tree/develop).

This means that all pull requests should be made against the [**develop**](https://github.com/mxcube/mxcube3/tree/develop) branch. The work on the **develop** branch is performed by simply creating a branch for the work to be done and then making a PR according to the description below.

* To fetch all branches and merge upstream to your forked develop branch:
  ```bash
  git fetch --all
  git checkout develop
  git rebase upstream/develop
  ```
 
* If you already are working on the **develop** branch and tracking the official repository, simply:
  ```bash
  git pull --rebase develop
  ```

We **recommend to always rebase your local changes instead of merging them**, git can be configured to do this by default:
  ```bash
  git config --global pull.rebase true
  ```

#### Preparing a new commit
* First, make sure that you are working with the latest changes from develop
```bash 
git checkout develop`
git pull --rebase develop
```
* Create a new branch, its recommended to use a meaningfull name. for instance [initials]-[fix/feature]-[some name] i.e mo-feature-gizmo1
 `git checkout -b mo-feature-gizmo1`
* If the pull request is associated with an issue then reference the issue in the name. For example:
  `git checkout -b issue_100` 
* Edit necessary files, delete existing or add a new file.
* Add files to the staging area:
   `git add ChangedFile1 ChangedFile2`
* Save your new commit to the local repository:
   `git commit`                          
* Commit command will open a text editor:
  * In the first line write a short commit summary (max 50 characters. It will appear as a title of PR.
  * Add an empty line.
  * Write a longer description.
* Upload the content of the new branch to the remote repository:
   `git push origin NEW_BRACH_NAME`
* Go to the github webpage and create a new PR.

#### Creating a new pull request via github webpage

* Keep the pull requests small preferbly contaning a single feature
* Give enough information about the changes in the pull request summary so that the reviewers easily understands whats been done
* Highlight technically complex/complicated sections of the code and supply additional comments to code that might need extra explication/motivation by making inline comments
* If needed assign a developer who shall review the PR.

### Accepting a pull request
* The author of a PR may request a PR review from a certain number of developers.
* A reviewer can Comment, Approve or Request changes.
* The changes made in the PR are assumed to be tested by the author
* All the assigned reviewers of a PR have to review the PR before it can be merged.
* A PR that has no reviewer assigned can be reviewed by anyone.
* The author of the PR is free to merge the PR once its been reviewed and all pending comments/discussions are solved 

### Versioning 
Versioning is partly automated by GitHub actions and [Poetry](https://python-poetry.org/)) and based on the gitflow braching model:

- Each new feature is implemented in a `feature branch`, branching from the `develop branch`.

- The minor version is bumped automatically by the CI workflow when a PR is merged on develop 

- The merge of a `feature branch` is made via PR to the `develop branch`. The author of 
  the PR must solve any conflicts with the latest development version before the merge.

- When decided, a release branch is created from the development branch and becomes
  a release candidate version.

- Once the code can be released, the release branch is merged to the `master branch` and
  also to the `develop branch`.
  
- If a bug is found in a released version, a `hotfix branch` is created with the 
  necessary changes and applied to the `main branch` and the corresponding commits are
  also cherry-picked to the development branch.

The exact routine is described more preceisly in [MEP01](https://github.com/mxcube/mxcubecore/blob/develop/doc/MEPS/MEP-01/mep01.md).

### Coding convention and style guidelines

#### Units
Functions returning a value representing a physical quantity should in general be assoicated with 
a unit. It has been agreed that the following units should, where applicable, be used across the 
code base

 * mm (millimeter) for translative motors and sizes
 * degrees for rotative motors
 * perecent (%) for ratios like attenuation
 * keV for energy
 * K (Kelvin) for temperature
 * Å (Ångström) for resolution
 * Pixels are to be used for beam location (center)
 * Datetime YYYY-MM-DD HH:MM:SS(.ff) ,possibly with hundreds of seconds (ff), and with 24 hour clock.

#### Type hints
We strongly encourage the usage of type hints 

#### Naming convention

##### Language and spelling
* UK english should be used for the spelling in documentation and code. Relevant examples for the mxcubecore code base are for instance the words *centring* and *characterisation* that are the prefered spelling instead of *centering* and *characterization*.

##### Functions
  * functions names should be recognisable as actions and should generally contain a verb

##### Variables and parameters:
 * names of objects and values are singular
 * names of collections are plural or contain an internal 'list' (or 'tuple', 'tpl')
 * names of maps are plural or contain 'map', 'dict', 'data', or an internel '2', like 'name2state'
 * variables should distinguish between objects (e.g. 'motor') and their names or string representations (e.g. 'motor_name'))
 * Booleans can be indcated by participles (e.g. 'enabled', 'tunable') or an 'is_' prefix. We should use positive rather than negative expressions (e.g. 'enabled' rather than 'disabled')
 
#### Properties v. functions
  * You should prefer functions ('get_', 'set_', 'update_') when attributes are mutable and changing the value requires moving hardware or is slow or has side effects, or where you (might) need additional parameters like swithces or timeout values.
    * For Boolean states prefer e.g. set_enabled (True/False) rather than separate enable()/disable() functions.
  * You should prefer properties for simple properties or states of objects (e.g. 'name', 'user_name', 'tolerance'). Contained HardwareObjects also use properties
  
 
#### Style guidlines

It is very important to write a clean and readable code. Therefore we follow the [PEP8 guidlines](https://www.python.org/dev/peps/pep-0008/). Minimal required guidlines are:
* Maximum 88 characters per line.
* Use 4 spaces (not a tab) per identation level.
* Do not use wild (star) imports.
* Used naming styles:
   * lower_case_with_underscores (snake style) for variables, methods.
   * CapitalizedWords for class names.
   * UPPERCASE for constants.
* When catching exceptions, mention specific exceptions whenever possible instead of using a bare except.
* Add [google style](https://www.sphinx-doc.org/en/master/usage/extensions/example_google.html?highlight=google%20style) doc strings to describe methods and classes. Types should be omitted in doc strings if the method is type hinted.

An example how to describe a class:

  ```bash
class ExampleClass(object):
    """The summary line for a class docstring should fit on one line.

    If the class has public attributes, they may be documented here
    in an ``Attributes`` section and follow the same formatting as a
    function's ``Args`` section. Alternatively, attributes may be documented
    inline with the attribute's declaration (see __init__ method below).

    Properties created with the ``@property`` decorator should be documented
    in the property's getter method.

    Attributes:
        attr1 (str): Description of `attr1`.
        attr2 (:obj:`int`, optional): Description of `attr2`.

    """

    def __init__(self, param1, param2, param3):
        """Example of docstring on the __init__ method.

        The __init__ method may be documented in either the class level
        docstring, or as a docstring on the __init__ method itself.

        Either form is acceptable, but the two should not be mixed. Choose one
        convention to document the __init__ method and be consistent with it.

        Note:
            Do not include the `self` parameter in the ``Args`` section.

        Args:
            param1 (str): Description of `param1`.
            param2 (:obj:`int`, optional): Description of `param2`. Multiple
                lines are supported.
            param3 (list(str)): Description of `param3`.

        """
        self.attr1 = param1
        self.attr2 = param2
        self.attr3 = param3  #: Doc comment *inline* with attribute

        #: list(str): Doc comment *before* attribute, with type specified
        self.attr4 = ['attr4']

        self.attr5 = None
        """str: Docstring *after* attribute, with type specified."""

  ```

An example how to describe a function:

  ```bash
def function_with_types_in_docstring(param1, param2):
    """Example function with types documented in the docstring.

    `PEP 484`_ type annotations are supported. If attribute, parameter, and
    return types are annotated according to `PEP 484`_, they do not need to be
    included in the docstring:

    Args:
        param1 (int): The first parameter.
        param2 (str): The second parameter.

    Returns:
        bool: The return value. True for success, False otherwise.

    .. _PEP 484:
        https://www.python.org/dev/peps/pep-0484/

    """

  ```

You can use [autopep8](https://pypi.org/project/autopep8/) and [black](https://pypi.org/project/autopep8/) to format your code:

  ```bash
  autopep8 -a -r -j 0 -i --max-line-length 88 ./
  black --safe ./
  ```

### Continuous integration (CI)

GitHub Action are used for continues integration

### Additional notes
Issue and Pull request Labels

* bug: indicates a bug in the code. Issue has a highest priority.
* abstract: Abstract class involved. Issue has a hight priority.
* question: general question.
* not used code: suggestion to remove a code block or a file from the repository.
* wip: work in progress
* enchancement: code improvement.

Milestones
