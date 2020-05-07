import React from 'react'
import { CircularProgress } from '@material-ui/core/'

export default function LoadingPanel() {
    return (
        <div class="foxy-loadingPanel">
            <CircularProgress />
            Finding best path
        </div>
    )
}
