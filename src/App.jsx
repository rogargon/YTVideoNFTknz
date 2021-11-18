import { useEffect } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter as Router, Switch, Route, NavLink, Redirect } from "react-router-dom";
import { Menu, Layout } from "antd";
import Account from "components/Account";
import Chains from "components/Chains";
import NFTTransfers from "components/NFTTransfers";
import NFTBalance from "components/NFTBalance";
import NFTList from "./components/NFTList";
import "antd/dist/antd.css";
import "./style.css";
import NFTMint from "./components/NFTMint";
import {PlaySquareTwoTone, InteractionTwoTone, WalletTwoTone, VideoCameraTwoTone} from "@ant-design/icons";
const { Header } = Layout;

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "100px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
};
const App = ({ isServerInfo }) => {
  const { isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading } = useMoralis();

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
  }, [isAuthenticated, isWeb3Enabled]);

  return (
    <Router>
      <Layout style={{ height: "100%", background: "#f0f2f500" }}>
        <Header style={styles.header}>
            <NavLink to="/nfts"><Logo /></NavLink>
          <Menu
            theme="light"
            mode="horizontal"
            style={{
              display: "flex",
              fontSize: "15px",
              fontWeight: "500",
              width: "100%",
              justifyContent: "left",
            }}
            defaultSelectedKeys={["nfts"]}
          >
            <Menu.Item key="nfts" icon={<PlaySquareTwoTone />}>
              <NavLink to="/nfts">NFTs</NavLink>
            </Menu.Item>
            <Menu.Item key="transfers" icon={<InteractionTwoTone />}>
              <NavLink to="/transfers">Transfers</NavLink>
            </Menu.Item>
            <Menu.Item key="wallet" icon={<WalletTwoTone />}>
                <NavLink to="/wallet">Wallet</NavLink>
            </Menu.Item>
              <Menu.Item key="mint" icon={<VideoCameraTwoTone />}>
                  <NavLink to="/mint">Mint</NavLink>
              </Menu.Item>
          </Menu>
          <div style={styles.headerRight}>
            <Chains />
            <Account />
          </div>
        </Header>
        <div style={styles.content}>
          <Switch>
            <Route path="/nfts">
              <NFTList />
            </Route>
            <Route path="/transfers">
              <NFTTransfers />
            </Route>
            <Route path="/wallet">
              <NFTBalance />
            </Route>
            <Route path="/nonauthenticated">
              <>Please login using the "Authenticate" button</>
            </Route>
          </Switch>
          <Redirect to="/nfts" />
        </div>
      </Layout>
    </Router>
  );
};

export const Logo = () => (
  <img style={{width: "250px"}} src="ytvnftknz.png"/>
);

export default App;
