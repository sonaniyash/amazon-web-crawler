import axios from 'axios';

export const getProduct = async () => {
    try {
        const headers = {
            "Content-Type": "application/json"
        };
        const res = await axios.get('https://toptechbestcool.com/api/get-product', { headers });
        console.log(res);
        return { data: res.data.data, status: 200 }
    } catch (err) {
        return { status: err && err.response && err.response.status };
    }
}

export const getProductKeyword = async (keyword: string) => {
    try {
        const headers = {
            "Content-Type": "application/json"
        };
        const res = await axios.post('https://toptechbestcool.com/api/get-product-by-keyword', { keyword }, { headers });
        console.log(res);
        return { data: res.data.data, status: 200 }
    } catch (err) {
        return { status: err && err.response && err.response.status };
    }
}