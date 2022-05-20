import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { Container, Row, Col } from 'react-bootstrap';
import { getProduct } from '../../services/home.service';
import './Home.css';
import { Product } from './Home.models';

const Home = () => {
    const [amazonData, setAmazonData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getProductItems();
    }, []);

    const getProductItems = async () => {
        setLoading(true);
        const res: any = await getProduct();
        if (res?.status === 200) {
            setAmazonData(res.data);
        } else {
            setError(true);
        }
        setLoading(false);
    }

    return (
        <>
            {loading && (
                <div className="loading">Loading&#8230;</div>
            )}
            <Container>
                <h2 style={{ marginTop: 14 }}>Amazon Best Seller</h2>
                <Row>
                    {amazonData.map((data: Product) => (
                        <Col md={4}>
                            <Card
                                img={data.img_url}
                                title={data.title}
                                url={data.product_url}
                                bestSeller={data.best_seller_name}
                            />
                        </Col>
                    ))}
                </Row>
            </Container>
            {error && (
                <p>Something went wrong please try again later...</p>
            )}
        </>
    );
}

export default Home;
