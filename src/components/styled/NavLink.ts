import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavLink = styled(Link)`
  display: block;
  width: 100%;
  height: 100%;
  padding: 0.5rem 1rem;
  color: #fff;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;
  box-sizing: border-box;

  &:hover {
    color: #61dafb;
  }
`;

export default NavLink;