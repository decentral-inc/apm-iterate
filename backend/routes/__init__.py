from .crm import router as crm_router
from .metrics import router as metrics_router
from .briefs import router as briefs_router

__all__ = ["crm_router", "metrics_router", "briefs_router"]
