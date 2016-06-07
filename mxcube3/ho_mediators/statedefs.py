#/usr/bin/python


class MOTOR_STATE:
    """
    Motor states, to be added to AbstractMotor definition when the web-
    application is in a more mature state.
    """
    NOTINITIALIZED = "NOTINITIALIZED"
    UNUSABLE = "UNUSABLE"
    READY = "READY"
    MOVESTARTED = "MOVESTARTED"
    MOVING = "MOVING"
    ONLIMIT = "ONLIMIT"

    VALUE_TO_STR = {0: "NOTINITIALIZED",
                    1: "UNUSABLE",
                    2: "READY",
                    3: "MOVESTARTED",
                    4: "MOVING",
                    5: "ONLIMIT"}


class INOUT_STATE:
    """
    States for inout devices, to be added to a future AbstractInOutDevice.
    """
    IN = "in"
    OUT = "out"
    UNDEFINED = "undefined"

    VALUE_TO_STR = {0: IN,
                    1: OUT,
                    2: UNDEFINED}

    STR_TO_VALUE = {IN: 0,
                    OUT: 1,
                    UNDEFINED: 2}
