using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EC2Dash.Models
{
    public class EC2Instance
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public string EC2Type { get; set; }
        public string State { get; set; }
        public string AZ { get; set; }
        public string PublicIP { get; set; }
        public string PrivateIP { get; set; }

        public string toString()
        {
            String retVal = "";

            retVal = Name + EC2Type + State + AZ + PublicIP + PrivateIP;

            return retVal;
        }
    }
}