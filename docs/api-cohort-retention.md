# API Endpoint: Cohort Retention

## Endpoint Details

### **URL**
```
GET /api/retention/cohort
```

### **Description**
Calcula métricas de retención por cohort mensual para talleres automotrices, proporcionando análisis detallado de la retención de clientes a lo largo del tiempo.

### **Authentication**
Requiere token JWT válido con `dealership_id` en el payload.

## Request/Response Examples

### **Request Parameters**

#### **Query Parameters**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | string | ✅ | - | JWT authentication token |
| `months_back` | number | ❌ | 24 | Months to analyze backwards (1-60) |
| `format` | string | ❌ | 'dashboard' | Response format ('dashboard' \| 'raw') |

#### **Example Request**
```bash
curl "http://localhost:3000/api/retention/cohort?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&months_back=24&format=dashboard"
```

### **Response Format**

#### **Dashboard Format (Default)**
```json
{
  "success": true,
  "dealership_id": "123e4567-e89b-12d3-a456-426614174000",
  "calculated_at": "2024-12-15T10:30:00.000Z",
  "months_analyzed": 24,
  "summary": {
    "total_cohorts": 8,
    "complete_cohorts": 6,
    "partial_cohorts": 2,
    "avg_retention_0_6m": 0.75,
    "avg_retention_6_12m": 0.45,
    "avg_retention_12_18m": 0.28,
    "total_new_clients": 1250,
    "latest_complete_cohort": "2024-06",
    "best_cohort_0_6m": "2024-03",
    "worst_cohort_0_6m": "2024-01"
  },
  "cohorts": [
    {
      "cohort_label": "2024-06",
      "cohort_month": "2024-06",
      "cohort_size": 150,
      "retention_rates": {
        "0_6m": 0.80,
        "6_12m": 0.50,
        "12_18m": 0.30
      },
      "retention_counts": {
        "0_6m": 120,
        "6_12m": 75,
        "12_18m": 45
      },
      "has_complete_data": true
    }
  ],
  "benchmarks": {
    "period_0_6m": {
      "average": 0.75,
      "min": 0.60,
      "max": 0.85,
      "median": 0.76,
      "count": 6
    },
    "period_6_12m": {
      "average": 0.45,
      "min": 0.30,
      "max": 0.60,
      "median": 0.44,
      "count": 6
    },
    "period_12_18m": {
      "average": 0.28,
      "min": 0.15,
      "max": 0.40,
      "median": 0.27,
      "count": 6
    }
  },
  "metadata": {
    "total_cohorts": 8,
    "execution_time_ms": 245,
    "data_complete_cohorts": 6,
    "data_partial_cohorts": 2
  }
}
```

#### **Raw Format**
```json
{
  "success": true,
  "dealership_id": "123e4567-e89b-12d3-a456-426614174000",
  "calculated_at": "2024-12-15T10:30:00.000Z",
  "months_analyzed": 24,
  "data": [
    {
      "cohort_label": "2024-06",
      "cohort_month": "2024-06",
      "cohort_size": 150,
      "retention_rates": {
        "0_6m": 0.80,
        "6_12m": 0.50,
        "12_18m": 0.30
      },
      "retention_counts": {
        "0_6m": 120,
        "6_12m": 75,
        "12_18m": 45
      },
      "data_complete": true
    }
  ],
  "metadata": {
    "total_cohorts": 8,
    "execution_time_ms": 245
  }
}
```

## Authentication Requirements

### **Token Validation**
- Token must be provided in query parameter
- Token must be valid JWT format
- Token must contain `dealership_id` in payload
- Token must not be expired

### **Example Token Structure**
```json
{
  "id": "worker_uuid",
  "email": "worker@dealership.com",
  "dealership_id": "123e4567-e89b-12d3-a456-426614174000",
  "names": "John Doe",
  "surnames": "Smith",
  "iat": 1702641600,
  "exp": 1702645200
}
```

## Error Handling

### **Error Response Format**
```json
{
  "error": "Error description",
  "details": "Additional error details (optional)"
}
```

### **HTTP Status Codes**

| Status | Description | Example |
|--------|-------------|---------|
| `200` | Success | Valid request with data |
| `400` | Bad Request | Invalid parameters |
| `401` | Unauthorized | Missing or invalid token |
| `404` | Not Found | No cohort data available |
| `500` | Internal Server Error | RPC or processing error |

### **Error Examples**

#### **401 - Missing Token**
```json
{
  "error": "Token is required"
}
```

#### **401 - Invalid Token**
```json
{
  "error": "Invalid or expired token"
}
```

#### **400 - Invalid Parameters**
```json
{
  "error": "months_back must be between 1 and 60"
}
```

#### **404 - No Data**
```json
{
  "error": "No cohort data found for this dealership"
}
```

#### **500 - RPC Error**
```json
{
  "error": "Error executing cohort retention calculation",
  "details": "Function calculate_monthly_cohort_retention does not exist"
}
```

## Data Processing Logic

### **Cohort Separation**
- **Complete cohorts**: `data_complete = true` - Full retention data available
- **Partial cohorts**: `data_complete = false` - Incomplete retention data

### **Retention Periods**
- **0-6 months**: Initial retention period
- **6-12 months**: Medium-term retention
- **12-18 months**: Long-term retention

### **Benchmark Calculations**
```typescript
interface BenchmarkStats {
  average: number;    // Mean retention rate
  min: number;        // Minimum retention rate
  max: number;        // Maximum retention rate
  median: number;     // Median retention rate
  count: number;      // Number of cohorts in calculation
}
```

### **Summary Metrics**
- **Total cohorts**: All cohorts in the analysis period
- **Complete cohorts**: Cohorts with full retention data
- **Partial cohorts**: Cohorts with incomplete data
- **Average retention**: Mean retention rate per period
- **Best/Worst cohorts**: Identified by 0-6m retention rate
- **Total new clients**: Sum of all cohort sizes

## Performance Considerations

### **Execution Time**
- **Target**: < 1000ms for 24 months
- **Measured**: `execution_time_ms` in response metadata
- **Factors**: Number of cohorts, data complexity, RPC performance

### **Optimization Strategies**
- Use SERVICE_ROLE_KEY for direct database access
- RPC function handles complex SQL calculations
- Minimal data processing in JavaScript
- Early validation to avoid unnecessary processing

## Database Dependencies

### **Required RPC Function**
```sql
CREATE OR REPLACE FUNCTION calculate_monthly_cohort_retention(
  p_dealership_id UUID,
  p_months_back INTEGER
) RETURNS TABLE (
  cohort_label TEXT,
  cohort_month TEXT,
  cohort_size INTEGER,
  retention_rates JSONB,
  retention_counts JSONB,
  data_complete BOOLEAN
)
```

### **Expected Data Sources**
- `client` table: Customer information
- `appointment` table: Service appointments
- `dealerships` table: Dealership information

### **Data Relationships**
- Clients grouped by first appointment month (cohort)
- Retention calculated based on subsequent appointments
- Dealership filtering via `dealership_id`

## Usage Examples

### **JavaScript/TypeScript**
```typescript
const fetchCohortRetention = async (token: string, monthsBack: number = 24) => {
  const response = await fetch(
    `/api/retention/cohort?token=${token}&months_back=${monthsBack}&format=dashboard`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
};

// Usage
try {
  const data = await fetchCohortRetention(token, 24);
  console.log('Retention summary:', data.summary);
  console.log('Best cohort:', data.summary.best_cohort_0_6m);
} catch (error) {
  console.error('Error fetching cohort retention:', error);
}
```

### **React Hook**
```typescript
const useCohortRetention = (token: string, monthsBack: number = 24) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchCohortRetention(token, monthsBack);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, monthsBack]);

  return { data, loading, error };
};
```

### **cURL Examples**
```bash
# Basic request
curl "http://localhost:3000/api/retention/cohort?token=your_token"

# With custom parameters
curl "http://localhost:3000/api/retention/cohort?token=your_token&months_back=12&format=raw"

# Error handling
curl -w "HTTP Status: %{http_code}\n" "http://localhost:3000/api/retention/cohort?token=invalid_token"
```

## Testing

### **Test Cases**
1. **Valid token with data** - Should return 200 with cohort data
2. **Valid token without data** - Should return 404
3. **Invalid token** - Should return 401
4. **Missing token** - Should return 401
5. **Invalid months_back** - Should return 400
6. **Invalid format** - Should return 400
7. **Raw format** - Should return unprocessed data
8. **Dashboard format** - Should return processed data with benchmarks

### **Performance Testing**
```bash
# Measure response time
time curl "http://localhost:3000/api/retention/cohort?token=your_token&months_back=24"

# Load testing with multiple requests
for i in {1..10}; do
  curl "http://localhost:3000/api/retention/cohort?token=your_token" &
done
wait
```

## Security Considerations

### **Input Validation**
- Token format validation
- Parameter range validation (months_back: 1-60)
- Format validation (dashboard/raw only)

### **Data Access**
- Dealership isolation via token verification
- No cross-dealership data access
- RPC function respects RLS policies

### **Error Information**
- Limited error details in production
- No sensitive data in error messages
- Proper HTTP status codes

## Monitoring and Logging

### **Log Format**
```
🔄 [Cohort Retention] Iniciando endpoint de retención por cohort...
✅ [Cohort Retention] Token verificado para dealership: 123e4567-e89b-12d3-a456-426614174000
📊 [Cohort Retention] Cohorts completos: 6, parciales: 2
✅ [Cohort Retention] Respuesta preparada exitosamente
```

### **Key Metrics**
- Execution time per request
- Success/error rates
- Data completeness statistics
- RPC performance metrics

### **Alerting**
- 500 errors (RPC failures)
- High execution times (>2000ms)
- Missing data scenarios
- Authentication failures 