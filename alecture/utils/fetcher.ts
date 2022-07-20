import axios from 'axios';

const fether = (url: string) => axios.get(url, { withCredentials: true }).then((response) => response.data);

export default fether;
