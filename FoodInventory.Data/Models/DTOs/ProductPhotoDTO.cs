using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodInventory.Data.Models.DTOs
{
    public class ProductPhotoDTO
    {
        public int ID { get; set; }
        public int ProductID { get; set; }
        public byte[] Photo { get; set; }
        public string Name { get; set; }
    }
}
