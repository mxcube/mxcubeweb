import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut, selectProposal, hideProposalsForm } from '../actions/login';
import SelectProposal from '../components/LoginForm/SelectProposal';
import { useNavigate } from 'react-router-dom';

function SelectProposalContainer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const login = useSelector((state) => state.login);

  function handleHide() {
    if (login.selectedProposalID === null) {
      dispatch(signOut());
    } else {
      dispatch(hideProposalsForm());
    }
  }

  const show =
    (login.loginType === 'User' && login.selectedProposalID === null) ||
    login.showProposalsForm;

  return (
    <SelectProposal
      show={show}
      handleHide={handleHide}
      data={login}
      selectProposal={(selected) => {
        dispatch(selectProposal(selected, navigate));
      }}
    />
  );
}

export default SelectProposalContainer;
