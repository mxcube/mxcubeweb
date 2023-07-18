// react-router-dom V6
// this component is use as Wrapper
// Other component can access router Props

import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    return <Component {...props} router={{ location, navigate, params }} />;
  }

  return ComponentWithRouterProp;
}
