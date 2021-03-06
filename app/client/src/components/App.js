import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import NavHeader from './NavHeader';
import SideBar from './SideBar';
import Card from './Card';
import '../css/app.css';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    let cards = null;
    let sidebar = null;
    if (this.props.data.loading) {
      sidebar = <h3>Loading...</h3>;
      cards = <h3>Loading contracts...</h3>;
    } else if (this.props.data.getUser.business.contracts.length === 0) {
      sidebar = (
        <SideBar
          key={this.props.data.getUser.business._id}
          name={this.props.data.getUser.business.name}
          logo={this.props.data.getUser.business.logo}
        />
      );
      cards = <h3 className="no-contracts">No contracts yet! Add a contract to get started...</h3>;
    } else {
      sidebar = (
        <SideBar
          key={this.props.data.getUser.business._id}
          name={this.props.data.getUser.business.name}
          logo={this.props.data.getUser.business.logo}
        />
      );
      cards = this.props.data.getUser.business.contracts.map(contract => (
        <div key={contract._id} className="col-4">
          <Card
            key={contract._id}
            {...contract}
          />
        </div>
      ));
    }

    return (
      <div>
        <NavHeader />
        <div className="row all-content">
          <div className="sideBar col-3">
            {sidebar}
          </div>
          <div className="main-card-area col-9">
            <div className="row">
              <h3 className="contracts-header">Contracts</h3>
              <Link to="/add_contractee"><span className="nav-link add-contract-link">+ New Contract</span></Link>
            </div>
            <div className="row">
              {cards}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const GetUser = gql`
  query GetUser {
    getUser {
      _id
      firstName
      lastName
      business {
        _id
        logo
        name
        contracts {
          _id
          first_name
          last_name
          email
          address
          completed
          status
          paymentContract {
            total
            fees
            down_payment
            insurance
            range
            monthly_payment
            terms
          }
        }
      }
    }
  }
`;

App.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.object,
};

export default withRouter(graphql(GetUser)(App));
