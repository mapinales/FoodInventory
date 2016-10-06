using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

using FoodInventory.Data;
using FoodInventory.Data.Models;
using System.IO;

namespace FoodInventory.API.Controllers
{
    [RoutePrefix("api/ProductPhoto")]
    public class ProductPhotoController : ApiController
    {
        private UnitOfWork _unitOfWork = new UnitOfWork();

        [HttpGet]
        public HttpResponseMessage Get([FromUri]int id)
        {
            try
            {
                var dbListingOfImageRecordsToReturn = _unitOfWork.ImageRepository.Get().Where(p => p.ProductID == id);
                var tempListToReturn = from r in dbListingOfImageRecordsToReturn
                                       select new FoodInventory.Data.Models.DTOs.ProductPhotoDTO()
                                       {
                                           ID = r.ID,
                                           ProductID = r.ProductID,
                                           Photo = r.Photo
                                       };
                
                return Request.CreateResponse(HttpStatusCode.OK, tempListToReturn.ToList());
            }
            catch (Exception exc)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, exc.ToString());
            }
        }

        [HttpPost]
        public HttpResponseMessage Post([FromBody] FoodInventory.Data.Models.DTOs.ProductPhotoDTO productPhotoToAdd)
        {
            try
            {
                var messageToReturn = "";

                var recordToAdd = new ProductPhoto
                {
                    ProductID = productPhotoToAdd.ProductID,
                    Photo = productPhotoToAdd.Photo,
                    Name = productPhotoToAdd.Name
                };

                //ensure that file is an allowable size
                if (recordToAdd.Photo.Length > 500000)
                {
                    messageToReturn = "Upload cancelled.  That file is too large.";
                    return Request.CreateResponse(HttpStatusCode.BadRequest, messageToReturn);
                }

                //persist data to the database
                _unitOfWork.ImageRepository.Insert(recordToAdd);
                _unitOfWork.Save();
                messageToReturn = "Added new photo for product " + recordToAdd.Name + ", ID " + recordToAdd.ProductID + ".";
                //return the result
                return Request.CreateResponse(HttpStatusCode.OK, messageToReturn);
            }
            catch (Exception exc)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, exc.ToString());
            }
        }
    }
}