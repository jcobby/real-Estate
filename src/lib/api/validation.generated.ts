// AUTO-GENERATED from Softmasters Land API v2.0 OpenAPI.
// Do not edit by hand — run `npm run gen:validation` to refresh from the backend.
import { z } from "zod";

export const registerRequestSchema = z.object({
  "name": z.string().min(2).max(120),
  "email": z.string().email().max(254),
  "phone": z.string().min(10).max(16).regex(new RegExp("^(\\+233|233|0)\\d{9}$")),
  "password": z.string().min(10).max(128).regex(new RegExp("^(?=.*[A-Za-z])(?=.*\\d).{10,128}$")),
  "role": z.enum(["buyer", "seller", "provider"])
});

export const loginRequestSchema = z.object({
  "email": z.string().email(),
  "password": z.string().min(1)
});

export const passwordResetRequestSchema = z.object({
  "email": z.string().email()
});

export const passwordResetConfirmRequestSchema = z.object({
  "token": z.string().min(1),
  "password": z.string().min(10).max(128).regex(new RegExp("^(?=.*[A-Za-z])(?=.*\\d).{10,128}$"))
});

export const updateProfileRequestSchema = z.object({
  "name": z.string().min(2).max(120).optional(),
  "phone": z.string().min(10).max(16).regex(new RegExp("^(\\+233|233|0)\\d{9}$")).optional(),
  "company": z.string().max(120).optional(),
  "region": z.string().max(120).optional(),
  "bio": z.string().max(500).optional(),
  "avatarUrl": z.string().url().optional()
});

export const createListingRequestSchema = z.object({
  "title": z.string().min(5).max(120),
  "type": z.enum(["land", "house", "commercial"]).optional(),
  "landStatus": z.enum(["developed", "semi-developed", "greenfield", "undeveloped"]),
  "price": z.number().int().min(0).max(1000000000),
  "negotiable": z.boolean().optional(),
  "region": z.string().min(1).max(120),
  "city": z.string().min(1).max(120),
  "address": z.string().max(240).optional(),
  "coords": z.object({
  "lat": z.number().min(-90).max(90),
  "lng": z.number().min(-180).max(180)
}),
  "sizeAcres": z.number().min(0),
  "plotsTotal": z.number().int().min(0).optional(),
  "plotsAvailable": z.number().int().min(0).optional(),
  "images": z.array(z.string().url()).max(20).optional(),
  "description": z.string().min(10).max(10000),
  "amenities": z.array(z.string()).max(50).optional(),
  "sellerType": z.enum(["agent", "owner", "developer"]).optional(),
  "status": z.enum(["draft", "pending-review", "active"]).optional(),
  "salesAgreement": z.string().optional(),
  "terms": z.string().optional(),
  "attributes": z.record(z.string(), z.unknown()).optional()
});

export const updateListingRequestSchema = z.object({
  "title": z.string().min(5).max(120).optional(),
  "type": z.enum(["land", "house", "commercial"]).optional(),
  "landStatus": z.enum(["developed", "semi-developed", "greenfield", "undeveloped"]).optional(),
  "price": z.number().int().min(0).max(1000000000).optional(),
  "negotiable": z.boolean().optional(),
  "region": z.string().min(1).max(120).optional(),
  "city": z.string().min(1).max(120).optional(),
  "address": z.string().max(240).optional(),
  "coords": z.object({
  "lat": z.number().min(-90).max(90),
  "lng": z.number().min(-180).max(180)
}).optional(),
  "sizeAcres": z.number().min(0).optional(),
  "plotsTotal": z.number().int().min(0).optional(),
  "plotsAvailable": z.number().int().min(0).optional(),
  "images": z.array(z.string().url()).max(20).optional(),
  "description": z.string().min(10).max(10000).optional(),
  "amenities": z.array(z.string()).max(50).optional(),
  "sellerType": z.enum(["agent", "owner", "developer"]).optional(),
  "status": z.enum(["active", "paused", "draft", "pending-review", "flagged", "removed"]).optional(),
  "salesAgreement": z.string().optional(),
  "terms": z.string().optional(),
  "attributes": z.record(z.string(), z.unknown()).optional()
});

export const createEstateRequestSchema = z.object({
  "listingId": z.string().min(1),
  "name": z.string().min(2).max(120),
  "region": z.string().min(1),
  "city": z.string().min(1),
  "center": z.object({
  "lat": z.number().min(-90).max(90),
  "lng": z.number().min(-180).max(180)
}),
  "zoom": z.number().int().min(1).max(22).optional(),
  "description": z.string().max(2000).optional(),
  "parcels": z.array(z.object({
  "type": z.enum(["Feature"]).optional(),
  "properties": z.object({
  "plotNumber": z.string().min(1),
  "owner": z.string().optional(),
  "status": z.enum(["available", "reserved", "sold"]).optional(),
  "areaSqm": z.number().min(0).optional(),
  "lengthM": z.number().min(0).optional(),
  "breadthM": z.number().min(0).optional(),
  "price": z.number().int().min(0)
}),
  "geometry": z.object({
  "type": z.enum(["Polygon"]),
  "coordinates": z.array(z.array(z.array(z.any()).min(2).max(2)).min(3)).min(1)
})
})).min(1).max(500)
});

export const setParcelStatusRequestSchema = z.object({
  "status": z.enum(["available", "reserved", "sold"])
});

export const startPurchaseRequestSchema = z.object({
  "plotIds": z.array(z.string().min(1)).min(1).max(50),
  "paymentMethod": z.enum(["mtn-momo", "vodafone-cash", "card"])
});

export const advanceEscrowRequestSchema = z.object({
  "action": z.enum(["advance", "release"])
});

export const monitorPurchaseRequestSchema = z.object({
  "monitored": z.boolean()
});

export const paymentSandboxCompleteRequestSchema = z.object({
  "reference": z.string().min(1),
  "outcome": z.enum(["success", "failed"])
});

export const addReviewRequestSchema = z.object({
  "targetId": z.string().min(1),
  "targetType": z.enum(["agent", "provider", "listing"]),
  "rating": z.number().int().min(1).max(5),
  "body": z.string().min(3).max(2000)
});

export const createProviderRequestSchema = z.object({
  "name": z.string().min(2).max(120),
  "category": z.enum(["surveyor", "property-manager", "developer", "painter", "electrician", "plumber", "photographer"]),
  "services": z.array(z.string().min(1)).max(30).optional(),
  "region": z.string().min(1).max(120),
  "city": z.string().min(1).max(120),
  "avatarUrl": z.string().url().optional(),
  "description": z.string().min(10).max(5000),
  "startingPrice": z.number().int().min(0).max(1000000000).optional(),
  "jobsDone": z.number().int().min(0).optional(),
  "yearsActive": z.number().int().min(0).max(80).optional()
});

export const updateProviderRequestSchema = z.object({
  "name": z.string().min(2).max(120).optional(),
  "category": z.enum(["surveyor", "property-manager", "developer", "painter", "electrician", "plumber", "photographer"]).optional(),
  "services": z.array(z.string().min(1)).max(30).optional(),
  "region": z.string().min(1).max(120).optional(),
  "city": z.string().min(1).max(120).optional(),
  "avatarUrl": z.string().url().optional(),
  "description": z.string().min(10).max(5000).optional(),
  "startingPrice": z.number().int().min(0).max(1000000000).optional(),
  "jobsDone": z.number().int().min(0).optional(),
  "yearsActive": z.number().int().min(0).max(80).optional()
});

export const createMaterialRequestSchema = z.object({
  "name": z.string().min(2).max(120),
  "category": z.enum(["cement", "blocks", "roofing", "steel", "aggregates", "timber", "plumbing", "electrical", "paint", "tools", "doors-windows", "tiles"]),
  "brand": z.string().max(80).optional(),
  "price": z.number().int().min(0).max(1000000000),
  "unit": z.string().min(1).max(40),
  "region": z.string().min(1).max(120),
  "description": z.string().min(5).max(5000),
  "deliveryDays": z.number().int().min(0).max(90).optional(),
  "inStock": z.boolean().optional(),
  "popular": z.boolean().optional(),
  "supplierName": z.string().min(1).max(120).optional()
});

export const updateMaterialRequestSchema = z.object({
  "name": z.string().min(2).max(120).optional(),
  "category": z.enum(["cement", "blocks", "roofing", "steel", "aggregates", "timber", "plumbing", "electrical", "paint", "tools", "doors-windows", "tiles"]).optional(),
  "brand": z.string().max(80).optional(),
  "price": z.number().int().min(0).max(1000000000).optional(),
  "unit": z.string().min(1).max(40).optional(),
  "region": z.string().min(1).max(120).optional(),
  "description": z.string().min(5).max(5000).optional(),
  "deliveryDays": z.number().int().min(0).max(90).optional(),
  "inStock": z.boolean().optional(),
  "popular": z.boolean().optional(),
  "supplierName": z.string().min(1).max(120).optional()
});

export const placeMaterialOrderRequestSchema = z.object({
  "lines": z.array(z.object({
  "materialId": z.string().min(1),
  "qty": z.number().int().min(1).max(9999)
})).min(1).max(50),
  "deliveryAddress": z.string().min(5).max(200),
  "region": z.string().min(1).max(120),
  "paymentMethod": z.enum(["mtn-momo", "vodafone-cash", "card"])
});

export const advanceMaterialOrderRequestSchema = z.object({
  "status": z.enum(["confirmed", "dispatched", "delivered"])
});

export const materialSandboxPayRequestSchema = z.object({
  "reference": z.string().min(1),
  "outcome": z.enum(["success", "failed"])
});

export const startConversationRequestSchema = z.object({
  "listingId": z.string().min(1),
  "sellerId": z.string().min(1),
  "body": z.string().min(1).max(5000)
});

export const sendMessageRequestSchema = z.object({
  "body": z.string().min(1).max(5000)
});

export const updateLeadRequestSchema = z.object({
  "status": z.enum(["new", "contacted", "qualified", "closed"]),
  "note": z.string().max(2000).optional()
});

export const submitVerificationRequestSchema = z.object({
  "listingId": z.string().min(1),
  "documents": z.array(z.object({
  "name": z.string().min(1).max(200),
  "type": z.enum(["indenture", "site-plan", "surveyor-report", "id", "title-certificate", "other"]),
  "sizeKb": z.number().int().min(0).max(20480).optional(),
  "storageKey": z.string().min(1).max(500)
})).min(1).max(20)
});

export const verificationReviewActionRequestSchema = z.object({
  "action": z.enum(["approve", "reject", "request-docs", "start-review"]),
  "adminNote": z.string().max(2000).optional(),
  "checks": z.array(z.object({
  "label": z.string().min(1),
  "passed": z.boolean()
})).optional()
});

export const createAbuseReportRequestSchema = z.object({
  "targetType": z.enum(["listing", "user"]),
  "targetId": z.string().min(1),
  "reason": z.string().min(3).max(200),
  "detail": z.string().min(5).max(5000),
  "reporterName": z.string().min(2).max(120).optional()
});

export const patchAdminUserRequestSchema = z.object({
  "role": z.enum(["buyer", "seller", "provider", "admin"]).optional(),
  "suspend": z.boolean().optional(),
  "suspendedReason": z.string().max(500).optional()
});

export const moderateListingRequestSchema = z.object({
  "action": z.enum(["approve", "flag", "remove", "pause", "restore"]),
  "note": z.string().max(2000).optional()
});

export const resolveAbuseReportRequestSchema = z.object({
  "status": z.enum(["investigating", "resolved", "dismissed"]),
  "resolutionNote": z.string().max(2000).optional()
});

export const runLandCheckRequestSchema = z.object({
  "ring": z.array(z.array(z.any()).min(2).max(2)).min(3).max(500)
});

export const emailLandCheckReportRequestSchema = z.object({
  "name": z.string().min(2).max(120),
  "email": z.string().email().max(254)
});

export const landCheckSandboxCompleteRequestSchema = z.object({
  "reference": z.string().min(1),
  "outcome": z.enum(["success", "failed"])
});

export const requestUploadSignRequestSchema = z.object({
  "purpose": z.enum(["listing-image", "verification-doc", "estate-geojson", "avatar", "other"]),
  "filename": z.string().min(1).max(200),
  "contentType": z.string().min(3).max(120),
  "sizeBytes": z.number().int().min(0).max(20971520).optional()
});

