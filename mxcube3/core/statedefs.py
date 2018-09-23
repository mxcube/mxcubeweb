# -*- coding: utf-8 -*-
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
    States for inout devices, mapped to the client (UI) representation of
    in out devices. IN state to be interpreted as positive
    (high/active/enabled) and OUT as negative (low/inactive/disabled).
    """
    IN = "in"
    OUT = "out"
    UNDEFINED = "undefined"

    TO_INOUT_STATE = {IN: IN,
                      OUT: OUT}

    STR_TO_VALUE = {OUT: 0,
                    IN: 1,
                    UNDEFINED: 2}

    STATE_TO_MSG_STR = {OUT: "OUT",
                        IN: "IN"}


class TANGO_SHUTTER_STATE:
    """
    State mapping for TangoShuter.TangoShutter
    """
    TO_INOUT_STATE = {"closed": INOUT_STATE.IN,
                      "opened": INOUT_STATE.OUT}
    
    STATE_TO_MSG_STR = {INOUT_STATE.OUT: "OPEN",
                        INOUT_STATE.IN: "CLOSED"}


class MICRODIFF_INOUT_STATE:
    """
    State mapping for MicrodiffInOut
    """
    TO_INOUT_STATE = {"in": INOUT_STATE.OUT,
                      "out": INOUT_STATE.IN}
    
    STATE_TO_MSG_STR = {INOUT_STATE.OUT: "OPEN",
                        INOUT_STATE.IN: "CLOSED"}


class BEAMSTOP_STATE:
    """
    State mapping for Beamstop
    """
    TO_INOUT_STATE = {"in": INOUT_STATE.OUT,
                      "out": INOUT_STATE.IN}

    STATE_TO_MSG_STR = {INOUT_STATE.OUT: "IN",
                        INOUT_STATE.IN: "OUT"}
