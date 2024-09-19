import { useNavigate } from 'react-router-dom';

// For class-based components, which can't call `useNavigate()`
export default function withNavigate(Component) {
  function ComponentWithNavigateProp(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  }

  return ComponentWithNavigateProp;
}
