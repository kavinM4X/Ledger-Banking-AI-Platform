import React, { useState } from 'react';
import { Search } from 'lucide-react';

const CustomerSearch = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="card search-card glass-panel">
      <h2>Find Customer</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Enter Customer ID (e.g. 100141)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="btn primary-btn">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};

export default CustomerSearch;

