import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;

  &:hover {
    color: #61dafb;
  }
`;

export default NavLink;