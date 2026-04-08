import NavbarContainer from './styled/NavbarContainer';
import NavList from './styled/NavList';
import NavItem from './styled/NavItem';
import NavLink from './styled/NavLink';

const Navbar = () => (
  <NavbarContainer>
    <NavList>
      <NavItem><NavLink to="/">Home</NavLink></NavItem>
      <NavItem><NavLink to="/about">About Us</NavLink></NavItem>
      <NavItem><NavLink to="/contact">Contact Us</NavLink></NavItem>
    </NavList>
  </NavbarContainer>
);

export default Navbar;
