// pages/CategoryNews.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import NewsCard from '../components/NewsCard'; // You can reuse or extract article card logic
import './HomeNews.css';

const CategoryNews = () => {
  const { category } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryNews = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/news/top-headlines?category=${category}`);
        setArticles(res.data.articles || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryNews();
  }, [category]);

  return (
    <div className="news-page-container">
      <h2>{category.charAt(0).toUpperCase() + category.slice(1)} News</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="articles-grid">
          {articles.map(article => (
            <NewsCard key={article.url} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryNews;
