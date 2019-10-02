import React from "react"
import { Box, Heading, Image } from "grommet"
import Img from 'gatsby-image'
import {Instagram, Facebook, Twitter} from 'grommet-icons'



const Header = ({headerIcon}) => (
  <Box

    elevation={"small"}
    as="header"
    background={
      {
        "color": "dark-1",
        "dark": true,
        opacity: true,
      }
    }

    direction={"row"}
    fill={"horizontal"}
    gap={"medium"}
    justify={"between"}
    align={"center"}
    pad={"small"}
  >
    {/*<Link*/}
    {/*  to="/"*/}
    {/*  style={{*/}
    {/*    color: `white`,*/}
    {/*    textDecoration: `none`,*/}
    {/*  }}*/}
    {/*>*/}
    <Box direction={"row"} align={"center"} gap={"small"}>
      <Box width={"xxsmall"} height={"xxsmall"}>
        <Img fluid={headerIcon.childImageSharp.fluid}/>
      </Box>
      <Heading>Style 42</Heading>
    </Box>

    <Box style={{
      "cursor": "pointer"
    }}gap={"small"} direction={"row"} align={"center"}>
      <Instagram />
      <Twitter/>
      <Facebook/>
    </Box>
    {/*</Link>*/}
  </Box>
)

export default Header

