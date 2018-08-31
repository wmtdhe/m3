    

function calnorm(indices,vertexArray,normalArray){
    //var face=indices.length;
    for(var j=0;j<indices.length;j+=3)
    {
        var v1 =[vertexArray[3*indices[j]],vertexArray[3*indices[j]+1],vertexArray[3*indices[j]+2]];
        var v2 = [vertexArray[3*indices[j+1]], vertexArray[3*indices[j+1]+1],vertexArray[3*indices[j+1]+2]];
        var v3 =[vertexArray[3*indices[j+2]], vertexArray[3*indices[j+2]+1],vertexArray[3*indices[j+2]+2]];
        
        var l1=[v2[0]-v1[0],v2[1]-v1[1],v2[2]-v1[2]];
        var l2=[v3[0]-v2[0],v3[1]-v2[1],v3[2]-v2[2]];
        //console.log(l1);
        var no=crossProduct(l1,l2);
        //var azhi=(no[0]^2+no[1]^2+no[2]^2)^(1/2);
        //console.log(azhi);
        //v1
        normalArray[3*indices[j]]=no[0];
        normalArray[3*indices[j]+1]=no[1];
        normalArray[3*indices[j]+2]=no[2];
        //v2
        normalArray[3*indices[j+1]]=no[0];
        normalArray[3*indices[j+1]+1]=no[1];
        normalArray[3*indices[j+1]+2]=no[2];
        //v3
        normalArray[3*indices[j+2]]=no[0];
        normalArray[3*indices[j+2]+1]=no[1];
        normalArray[3*indices[j+2]+2]=no[2]; 
        //console.log(normalArray[3*j+3*21]^2+
        //normalArray[3*j+3*21+1]^2+
        //normalArray[3*j+3*21+2]^2);
    
    }
        for (var i = 0; i < normalArray.length; i+=3){
        // normalize the normal vector
        var normal = vec3.fromValues(normalArray[i], normalArray[i+1], normalArray[i+2]);
        var normalized = vec3.create();
        vec3.normalize(normalized, normal);
        
        // store the normal vector
        normalArray[i] = normalized[0];
        normalArray[i+1] = normalized[1];
        normalArray[i+2] = normalized[2];
    }
}

    function crossProduct(v1, v2) {
        return [  ( (v1[1] * v2[2]) - (v1[2] * v2[1]) ),
        - ( (v1[0] * v2[2]) - (v1[2] * v2[0]) ),
     ( (v1[0] * v2[1]) - (v1[1] * v2[0]) )];
    }
