import axios from 'axios';

export default {
  login(loginInfo) {
    return axios('http://localhost:4000/auth/sign-in', {
      method: 'post',
      data: loginInfo,
      withCredentials: true,
    });
  },
  signup(signupInfo) {
    return axios('http://localhost:4000/auth/sign-up', {
      method: 'post',
      data: signupInfo,
      withCredentials: true,
    });
  },
};
