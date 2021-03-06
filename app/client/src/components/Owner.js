import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const Owner = ({ data: { loading, error, getAllOwners } }) => {
  if (loading) {
    return <p>Fetching Data...</p>;
  }
  if (error) {
    return <p>{error.message}</p>;
  }
  return (
    <ul>
      { getAllOwners.map(owner => <li key={owner._id}>{owner.firstName}</li>) }
    </ul>);
};

export const OwnerQuery = gql`
  query OwnerQuery {
    getAllOwners {
      _id
      firstName
    }
  }
`;

Owner.propTypes = {
  data: PropTypes.func.isRequired,
};

export default graphql(OwnerQuery)(Owner);
