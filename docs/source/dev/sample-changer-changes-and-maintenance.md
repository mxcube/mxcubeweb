# Sample Changer changes and Sample Changer maintenance

A new commit just proposed (August 2017) introduces a number of changes to the existing support for SampleChanger in mxcube3 and introduces support for "maintenance" commands. This note explains the motivation and some details about this implementation:

## Changes in support for SampleChanger

The following changes are introduced and explained below:

- STATE of SC now represents state of SampleChanger hardware (before it was showing the result of the previous action in the interface)
- loadedSample (with address and ID/Barcode) now separated from contents and included in app state->SampleChanger
- Unload and Abort commands are proposed in SampleChanger component when a sample is loaded (Unload) and when the SC is in moving state (Abort)
- routes for loaded_sample, state, contents added
  (support for SampleChanger corresponds with GenericSampleChanger features, state defs and API)

## SampleChangerMaintenance support

As mxcube user are often confronted with a number of "maintenance" operation with the sample changer (open lids, soak-dry-home or other trajectories, etc...) a new set of features and graphical component has been added in mxcube3.

To be able to respond to different types of sample changers with completely different set of maintenance commands the associated hardware object must provide all necessary information about:

- which commands exist
- which commands are available for the user at a particular moment
- an array with different state bits (general state, powered-state, lids-state... or other)
- a free-format message to inform users about any incidence

SC_Maintenance hardware object must provide:
(see CatsMaint.py in HardwarObjects/sample_changer for example): ::

get_cmd_info() method
returns a list with a series of "command groups". Each group is composed of a label and as list of commands
a command is represented as a list with at least 3 values:
cmd = [ cmdname, cmdlabel, cmddesc ]

send_command(cmdname, args) method
this method will actually execute the command

get_global_state() method
returns three values:

```
  state_dict():
      dictionary with keys and boolean value indicating state of subsystem (on/off)

  cmd_state_dict():
      for every cmdname given in the data returned by get_cmd_info() this dictionary, indexed by cmdname, provides a boolean value to specify whether the commands is currently available for use or not.

  message:
      string containing meaningful information about operation, incidences or other
```

SIGNAL: globalStateChanged, (state_dict, cmd_state_dict, message).
emit the same information as in get_global_state() at any time it changes

mxcube3 conforms to the the interface described above to propose a panel (in SampleChanger tab) that will adapt to that information. No assumption about a particular type of sample changer or command is done in that panel.

a SampleChangerMaintenance object has been added to the app state to include the information described above for the use of the app.

the following routes are available to check the information about at any moment.
/mxcube/api/v0.1/sample_changer/get_global_state
/mxcube/api/v0.1/sample_changer/get_maintenance_cmds
/mxcube/api/v0.1/sample_changer/send_command/<cmdparts>

(for now cmdparts only include a command name, not arguments are supported. If necessary this could be added in a later commit)

## Other changes

The SampleChanger container is now composed of three components.
SampleChangerState: just showing the updated state of the SC hardware
SampleChanger: contains refresh, scan buttons plus the new unload and abort buttons (depending on state)
it also shows the sample tree from which to load individual samples manually
SampleChangerMaintenance: gives acccess to other SC commands (as described in previous paragraph)
