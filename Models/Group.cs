using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EC2Dash.Models
{
    public class Group
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public String Members { get; set; }
    }
}