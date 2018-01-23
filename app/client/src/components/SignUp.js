import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

class SignUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  handleInputChange(e) {
    const target = e.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value,
    });
  }

  onClick(e) {
    e.preventDefault();
    this.props.mutate({
      variables: {
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        email: this.state.email,
        username: this.state.username,
        password: this.state.password,
        role: 'owner',
      },
    }).then((user) => {
      console.log('user added', user.data.signup);
    }).catch((error) => {
      console.log('No user added because of an error:', error);
    });
  }

  render() {
    return (
      <div>
        <form>
          <input
            type="text"
            placeholder="First Name"
            name="firstName"
            value={this.state.firstName}
            onChange={this.handleInputChange}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            name="lastName"
            value={this.state.lastName}
            onChange={this.handleInputChange}
            required
          />
          <input
            type="text"
            placeholder="Email Address"
            name="email"
            value={this.state.email}
            onChange={this.handleInputChange}
            required
          />
          <input
            type="text"
            placeholder="Username"
            name="username"
            value={this.state.username}
            onChange={this.handleInputChange}
            required
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={this.state.password}
            onChange={this.handleInputChange}
            required
          />
          <button type="Submit" onClick={this.onClick}>Submit</button>
        </form>
      </div>
    );
  }
}

const AddNewUser = gql`
    mutation signup($firstName: String, $lastName: String, $username: String, $password: String, $email: String, $role: String) {
      signup(firstName: $firstName, lastName: $lastName, username: $username, password: $password, email: $email, role: $role) {
        _id
        firstName
        lastName
        username
      }
    }
  `;

SignUp.propTypes = {
  mutate: PropTypes.func,
};


export default graphql(AddNewUser)(SignUp);
