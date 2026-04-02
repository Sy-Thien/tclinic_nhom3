import React from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

export default function withRouter(Component) {
    function ComponentWithRouterProp(props) {
        const navigate = useNavigate();
        const location = useLocation();
        const params = useParams();
        const [searchParams, setSearchParams] = useSearchParams();

        return (
            <Component
                {...props}
                navigate={navigate}
                location={location}
                params={params}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
            />
        );
    }

    ComponentWithRouterProp.displayName = `withRouter(${Component.displayName || Component.name || 'Component'})`;
    return ComponentWithRouterProp;
}
