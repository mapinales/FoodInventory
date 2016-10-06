$(function () {
    'use strict';

    GetAllProducts("#tblListingOfProducts");
});

function PrepareDataTable(TableToPopulate) {
    if (typeof (TableToPopulate) === 'undefined' || TableToPopulate === null) {
        return false;
    }

    $(TableToPopulate).DataTable({
        "lengthMenu": [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        "order": [[0, 'asc']],
        "scrollY": '40vh',
        "scrollCollapse": true,
        "language": {
            "decimal": "",
            "emptyTable": "No products are available",
            "info": "Showing _START_ to _END_ of _TOTAL_ existing products",
            "infoEmpty": "Showing 0 to 0 of 0 products",
            "infoFiltered": "(filtered from _MAX_ existing products)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Show _MENU_",
            "loadingRecords": "Loading...",
            "processing": "Processing...",
            "search": "Search:",
            "zeroRecords": "No matching products found",
            "paginate": {
                "first": "First",
                "last": "Last",
                "next": "Next",
                "previous": "Previous"
            },
            "aria": {
                "sortAscending": ": activate to sort column ascending",
                "sortDescending": ": activate to sort column descending"
            }
        },
        "dom": 'lC<"#buttonDisplayProducts">frtip',
        "drawCallback": function (settings) {
            'use strict';

            $('#buttonDisplayProducts').empty();
            var buttonApplicationHTML = "<input type='button' class='btn btn-sm btn-primary FoodInventoryAddProductButton' role='button' value='Add'/>"
            $(buttonApplicationHTML).css('margin-left', '10px').hide().appendTo('#buttonDisplayProducts').fadeIn();
            $('#buttonDisplayProducts').addClass('pull-left');

            InitializeEventHandlers(TableToPopulate);
            
        }
    });
}

function GetAllProducts(TableToPopulate) {
    if (typeof (TableToPopulate) === 'undefined' || TableToPopulate === null) {
        return false;
    }

    var dataRetrieval = $.ajax({
        url: FoodInventory.ProductsAPIURL,
        type: 'GET',
        dataType: 'json',
        data: {
            id: 0
        }
    });

    dataRetrieval.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Retrieving Products',
            message: jqXHR.responseText
        });
    });

    dataRetrieval.done(function (data) {
        'use strict';

        if (typeof (data) === 'undefined' || data === null) {
            BootstrapDialog.show({
                type: BootstrapDialog.TYPE_WARNING,
                title: 'Unknown Response while Retrieving Products',
                message: "The server returned an unknown resultset when attempting to retriece the listing of products."
            });
        }

        if (!$.fn.DataTable.isDataTable(TableToPopulate)) {
            PrepareDataTable(TableToPopulate);
        }

        var dataTableObject = $(TableToPopulate).DataTable();

        dataTableObject.clear();

        var iLength = data.length;
        for (var p = 0; p < iLength; ++p) {
            dataTableObject.row.add([
                data[p].ID,
                data[p].Name,
                "$" + data[p].PurchasePrice.toFixed(2),
                "$" + data[p].SalesPrice.toFixed(2),
                moment(data[p].SpoilDate).format("MM/DD/YYYY"),
                data[p].UnitsAvailable,
                '<input type="button" class="btn btn-sm btn-primary FoodInventoryPhotoButton" role="button" value="Photos"/>&nbsp;<input type="button" class="btn btn-sm btn-primary FoodInventoryEditProductButton" role="button" value="Edit"/>&nbsp;<input type="button" class="btn btn-sm btn-danger FoodInventoryDeleteProductButton" role="button" value="Delete"/>'
            ]).draw(false);
        }

        InitializeEventHandlers(TableToPopulate);
    });
}

function InitializeEventHandlers(TableToPopulate) {
    'use strict';

    if (typeof (TableToPopulate) === 'undefined' || TableToPopulate === null) {
        return false;
    }

    $('.FoodInventoryPhotoButton').off().on('click', function (e) {
        'use strict';

        var currentTable = $(TableToPopulate).DataTable();
        var currentRow = $(this).parent().parent();
        var RowData = currentTable.row(currentRow).data();

        BootstrapDialog.show({
            type: BootstrapDialog.OK,
            title: 'Add/View Photos for Product - ' + RowData[1] + ' (' + RowData[0] + ')',
            message: "<div id='photoForm' style='max-height: 400px;'></div>",
            onshown: function (dialog) {
                LoadAddPhotoForm('#photoForm', function () {
                    var retrievePhotos = $.ajax({
                        url: FoodInventory.ProductPhotosAPIURL,
                        type: 'GET',
                        data: {
                            id: RowData[0]
                        }
                    });

                    retrievePhotos.fail(function (jqXHR, textStatus, errorThrown) {
                        'use strict';

                        BootstrapDialog.show({
                            type: BootstrapDialog.TYPE_DANGER,
                            title: 'Problem with photos for Product (' + RowData[1] + ') with ID (' + RowData[0] + ')',
                            message: jqXHR.responseText
                        });
                    });

                    retrievePhotos.done(function (data) {
                        var string = ""

                        //create the links to select between the images
                        for (var i = 0; i < data.length; i++) {
                            string += "<a id='image" + (i + 1) + "' class='imageLink' data-image='data:image/png;base64," + data[i].Photo + "'>Image " + (i + 1) + "</a>&nbsp&nbsp";
                        }
                        //put the links on the dom
                        $('#imageLinks').html(string);

                        //if a link is clicked, switch the image in the placeholder
                        $('.imageLink').off().on('click', function (e) {
                            $('#imageHolder').prop('src', $(this).data("image"));
                            //highlight the link for the image shown
                            $(".activeLink").removeClass("activeLink");
                            $(this).addClass("activeLink");
                        });
                        //put the first image in the placeholder when the dialog opens
                        $('#image1').trigger('click');
                        //if there are no images for a product, display a message saying so
                        if (data.length < 1) {
                            $('#imageLinks').html("There are currently no images for this product.");
                        }

                        $('#frmAddProductPhoto').validate({
                            errorClass: "productError",
                            rules: {
                                txtFileName: {
                                    required: true,
                                    accept: 'image/jpeg, image/png, image/jpg',
                                    filesize: 500000
                                }
                            },
                            messages: {
                                txtFileName: {
                                    required: "Please select an image file to upload.",
                                    accept: "Please select only .jpg or .png files.",
                                    filesize: "Please select a file less than 500KB."
                                }
                            }
                        });
                    });
                });
            },
            buttons: [
                {
                    label: 'Add',
                    cssClass: 'btn-primary',
                    icon: 'glyphicon glyphicon-plus',
                    action: function (dialog) {
                        'use strict';
                        var $button = this;

                        $button.spin();

                        $('#frmAddProductPhoto').validate();

                        if ($('#frmAddProductPhoto').valid()) {    
                            var file = $('#txtFileName').prop("files")[0];                            
                            var reader = new FileReader();
                            if (FileReader && file) {
                                reader.readAsArrayBuffer(file);
                                reader.onload = function () {
                                    //convert the data to a byte array
                                    var fileData = reader.result;
                                    var fileByteArray = new Uint8Array(fileData);

                                    //create the image record
                                    var dataToSave = {
                                        ProductID: RowData[0],
                                        Photo: fileByteArray,
                                        Name: RowData[1]
                                    };

                                    //save the record
                                    SubmitNewProductPhoto(dataToSave, dialog, $button);
                                };
                            }
                        } else {
                            $button.stopSpin();
                            //Form not valid; user must correct.
                        }
                    }
                }
            ]
        });
    });

    $('.FoodInventoryEditProductButton').off().on('click', function (e) {
        'use strict';
        var currentTable = $(TableToPopulate).DataTable();
        var currentRow = $(this).parent().parent();
        var RowData = currentTable.row(currentRow).data();

        BootstrapDialog.show({
            type: BootstrapDialog.OK,
            title: 'Edit Product - ' + RowData[1] + ' (' + RowData[0] + ')',
            message: "<div id='containerEditForm'></div>",
            onshown: function (dialog) {
                LoadAddEditForm('#containerEditForm', function () {

                    var retrieveProduct = $.ajax({
                        url: FoodInventory.ProductsAPIURL,
                        type: 'GET',
                        dataType: 'json',
                        data: {
                            id: RowData[0]
                        }
                    });

                    retrieveProduct.fail(function (jqXHR, textStatus, errorThrown) {
                        'use strict';

                        BootstrapDialog.show({
                            type: BootstrapDialog.TYPE_DANGER,
                            title: 'Problem with Retrieving Product (' + RowData[1] + ') with ID (' + RowData[0] + ')',
                            message: jqXHR.responseText
                        });
                    });

                    retrieveProduct.done(function (data) {
                        'use strict';

                        $('#txtProductName').val(data.Name);
                        $('#txtProductDescription').val(data.Description);
                        $('#txtProductPurchasePrice').val(data.PurchasePrice.toFixed(2));
                        $('#txtProductSalesPrice').val(data.SalesPrice.toFixed(2));
                        $('#txtProductSpoilDate').val(moment(data.SpoilDate).format("MM/DD/YYYY"));
                        $('#txtProductUnitsAvailable').val(data.UnitsAvailable);

                        $('.date-picker').datepicker();

                        $('#txtProductPurchasePrice').mask("000,000,000,000,000.00", { reverse: true });
                        $('#txtProductSalesPrice').mask("000,000,000,000,000.00", { reverse: true });
                        $('#txtProductUnitsAvailable').mask("#", { reverse: true });

                        $('#frmAddEditProduct').validate({
                            errorClass: "productError",
                            rules: {
                                txtProductName: {
                                    required: true
                                },
                                txtProductPurchasePrice: {
                                    required: true
                                },
                                txtProductSalesPrice: {
                                    required: true
                                },
                                txtProductSpoilDate: {
                                    date: true
                                },
                                txtProductUnitsAvailable: {
                                    required: true,
                                    number: true
                                }
                            },
                            messages: {
                                txtProductName: {
                                    required: "Please type in the name for the product."
                                },
                                txtProductPurchasePrice: {
                                    required: "Please type in the purchase price for the product."
                                },
                                txtProductSalesPrice: {
                                    required: "Please type in the price you are selling the product for."
                                },
                                txtProductSpoilDate: {
                                    date: "Please type in a valid date that the product will spoil. Note that this field is not required."
                                },
                                txtProductUnitsAvailable: {
                                    required: "Please type in the amount of units that you have in stock for this product.",
                                    number: "Please type in a numerical amount for this product."
                                }
                            }
                        });
                    });
                });
            },
            buttons: [
                {
                    label: 'Save',
                    cssClass: 'btn-primary',
                    icon: 'glyphicon glyphicon-plus',
                    action: function (dialog) {
                        'use strict';
                        var $button = this;

                        $button.spin();
                        //dialog.setClosable(false);

                        $('#frmAddEditProduct').validate();

                        if ($('#frmAddEditProduct').valid()) {
                            //$button.enable();

                            //Save Product.

                            var dataToSave = {
                                ID: RowData[0],
                                Name: $('#txtProductName').val(),
                                Description: $('#txtProductDescription').val(),
                                PurchasePrice: $('#txtProductPurchasePrice').val(),
                                SalesPrice: $('#txtProductSalesPrice').val(),
                                SpoilDate: $('#txtProductSpoilDate').val(),
                                UnitsAvailable: $('#txtProductUnitsAvailable').val(),
                                DeletedDate: null
                            }

                            SubmitNewProduct(dataToSave, dialog);

                            $button.stopSpin();
                        } else {
                            $button.stopSpin();
                            //Form not valid; user must correct.
                        }
                        //dialog.setClosable(true);
                    }
                },
                {
                    label: 'Cancel',
                    cssClass: 'btn-default',
                    action: function (dialog) {
                        'use strict';
                        dialog.close();
                    }
                }
            ]
        });
    });

    $('.FoodInventoryDeleteProductButton').off().on('click', function (e) {
        'use strict';

        var currentTable = $(TableToPopulate).DataTable();
        var currentRow = $(this).parent().parent();
        var RowData = currentTable.row(currentRow).data();

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_WARNING,
            title: 'Delete Product - ' + RowData[1] + ' (' + RowData[0] + ')?',
            message: "Are you sure you want to delete the Product (" + RowData[1] + ") with ID (" + RowData[0] + ")?",//PermissionsPortal.popupContainerData,
            onshown: function (dialog) {
                //On Shown method here.
            },
            buttons: [
                {
                    label: 'Delete',
                    cssClass: 'btn-danger',
                    icon: 'glyphicon glyphicon-trash',
                    action: function (dialog) {
                        'use strict';
                        DeleteProduct(Number(RowData[0]), dialog);
                    }
                },
                {
                    label: 'Cancel',
                    cssClass: 'btn-default',
                    action: function (dialog) {
                        'use strict';
                        dialog.close();
                    }
                }
            ]
        })
    });

    $('.FoodInventoryAddProductButton').off().on('click', function (e) {
        'use strict';
        BootstrapDialog.show({
            type: BootstrapDialog.OK,
            title: 'Add New Product',
            message: "<div id='containerAddForm'></div>",
            onshown: function (dialog) {
                LoadAddEditForm('#containerAddForm', function () {
                    $('.date-picker').datepicker();

                    $('#txtProductPurchasePrice').mask("000,000,000,000,000.00", { reverse: true });
                    $('#txtProductSalesPrice').mask("000,000,000,000,000.00", { reverse: true });
                    $('#txtProductUnitsAvailable').mask("#", { reverse: true });

                    $('#frmAddEditProduct').validate({
                        errorClass: "productError",
                        rules: {
                            txtProductName: {
                                required: true
                            },
                            txtProductPurchasePrice: {
                                required: true
                            },
                            txtProductSalesPrice: {
                                required: true
                            },
                            txtProductSpoilDate: {
                                date: true
                            },
                            txtProductUnitsAvailable: {
                                required: true,
                                number: true
                            }
                        },
                        messages: {
                            txtProductName: {
                                required: "Please type in the name for the product."
                            },
                            txtProductPurchasePrice: {
                                required: "Please type in the purchase price for the product."
                            },
                            txtProductSalesPrice: {
                                required: "Please type in the price you are selling the product for."
                            },
                            txtProductSpoilDate: {
                                date: "Please type in a valid date that the product will spoil. Note that this field is not required."
                            },
                            txtProductUnitsAvailable: {
                                required: "Please type in the amount of units that you have in stock for this product.",
                                number: "Please type in a numerical amount for this product."
                            }
                        }
                    });
                });
            },
            buttons: [
                {
                    label: 'Save',
                    cssClass: 'btn-primary',
                    icon: 'glyphicon glyphicon-plus',
                    action: function (dialog) {
                        'use strict';
                        var $button = this;

                        $button.spin();
                        //dialog.setClosable(false);

                        $('#frmAddEditProduct').validate();

                        if ($('#frmAddEditProduct').valid()) {
                            //$button.enable();

                            //Save Product.

                            var dataToSave = {
                                ID: 0,
                                Name: $('#txtProductName').val(),
                                Description: $('#txtProductDescription').val(),
                                PurchasePrice: $('#txtProductPurchasePrice').val(),
                                SalesPrice: $('#txtProductSalesPrice').val(),
                                SpoilDate: $('#txtProductSpoilDate').val(),
                                UnitsAvailable: $('#txtProductUnitsAvailable').val(),
                                DeletedDate: null
                            }

                            SubmitNewProduct(dataToSave, dialog);

                            $button.stopSpin();
                        } else {
                            $button.stopSpin();
                            //Form not valid; user must correct.
                        }
                        //dialog.setClosable(true);
                    }
                },
                {
                    label: 'Cancel',
                    cssClass: 'btn-default',
                    action: function (dialog) {
                        'use strict';
                        dialog.close();
                    }
                }
            ]
        });
    });
}

function LoadAddPhotoForm(FormContainer, OnFormLoadedCallBack) {
    'use strict';

    if (typeof (FormContainer) === 'undefined' || FormContainer === null) {
        return false;
    }
    var partialLoader = $.ajax({
        url: FoodInventory.ProductPhotoAddFormURL,
        type: 'GET',
        dataType: 'html'
    });

    partialLoader.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Proplem with Loading Photo Form',
            message: jqXHR.responseText
        });
    });

    partialLoader.done(function (data, status, xhr) {
        'use strict';
        $(FormContainer).html(data);
        if (typeof (OnFormLoadedCallBack) === "function" && OnFormLoadedCallBack !== null) {
            OnFormLoadedCallBack();
        }
    });
}

function LoadAddEditForm(FormContainer, OnFormLoadedCallBack) {
    'use strict';

    if (typeof (FormContainer) === 'undefined' || FormContainer === null) {
        return false;
    }
    var partialLoader = $.ajax({
        url: FoodInventory.ProductsAddEditFormURL,
        type: 'GET',
        dataType: 'html'
    });

    partialLoader.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Loading Product Form',
            message: jqXHR.responseText
        });
    });

    partialLoader.done(function (data, status, xhr) {
        'use strict';
        $(FormContainer).html(data);
        if (typeof (OnFormLoadedCallBack) === "function" && OnFormLoadedCallBack !== null) {
            OnFormLoadedCallBack();
        }
    });
}

function SubmitNewProductPhoto(DataFromForm, DialogWindow, Button) {
    'use strict';
    if (typeof (DataFromForm) === 'undefined' || DataFromForm === null) {
        return false;
    }

    if (typeof (DialogWindow) === 'undefined' || DialogWindow === null) {
        return false;
    }

    var productPhotoSubmission = $.ajax({
        url: FoodInventory.ProductPhotosAPIURL,
        type: 'POST',
        dataType: 'json',
        cache: false,
        data: DataFromForm
    });

    productPhotoSubmission.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        Button.stopSpin();

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Adding Product Photo',
            message: jqXHR.responseText
        });

        DialogWindow.close();
    });

    productPhotoSubmission.done(function (data) {
        'use strict';

        Button.stopSpin();

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_SUCCESS,
            title: 'Added Product Photo',
            message: data
        });

        DialogWindow.close();
    });

    return true;
}

function SubmitNewProduct(DataFromForm, DialogWindow) {
    'use strict';
    if (typeof (DataFromForm) === 'undefined' || DataFromForm === null) {
        return false;
    }

    if (typeof (DialogWindow) === 'undefined' || DialogWindow === null) {
        return false;
    }

    var productSubmission = $.ajax({
        url: FoodInventory.ProductsAPIURL,
        type: 'POST',
        dataType: 'json',
        cache: false,
        data: DataFromForm
    });

    productSubmission.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Adding Product',
            message: jqXHR.responseText
        });

        DialogWindow.close();
    });

    productSubmission.done(function (data) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_SUCCESS,
            title: 'Added Product',
            message: data
        });

        GetAllProducts("#tblListingOfProducts");

        DialogWindow.close();

    });

    return true;
}

function DeleteProduct(IDOfProductToDelete, DialogWindow) {
    'use strict';

    if (typeof (IDOfProductToDelete) === 'undefined' || IDOfProductToDelete === null) {
        return false;
    }

    if (typeof (DialogWindow) === 'undefined' || DialogWindow === null) {
        return false;
    }

    var productDeletion = $.ajax({
        url: FoodInventory.ProductsAPIURL + '/Delete',
        type: 'GET',
        dataType: 'json',
        cache: false,
        data: {
            id: IDOfProductToDelete
        }
    });

    productDeletion.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Deleting Product',
            message: jqXHR.responseText
        });

        DialogWindow.close();
    });

    productDeletion.done(function (data) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_SUCCESS,
            title: 'Deleted Product',
            message: data
        });

        GetAllProducts("#tblListingOfProducts");

        DialogWindow.close();

    });

    return true;
}

function EditExistingProduct(DataFromForm, DialogWindow) {
    'use strict';
    if (typeof (DataFromForm) === 'undefined' || DataFromForm === null) {
        return false;
    }

    if (typeof (DialogWindow) === 'undefined' || DialogWindow === null) {
        return false;
    }

    var productSubmission = $.ajax({
        url: FoodInventory.ProductsAPIURL,
        type: 'POST',
        dataType: 'json',
        cache: false,
        data: DataFromForm
    });

    productSubmission.fail(function (jqXHR, textStatus, errorThrown) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Problem with Adding Product',
            message: jqXHR.responseText
        });

        DialogWindow.close();
    });

    productSubmission.done(function (data) {
        'use strict';

        BootstrapDialog.show({
            type: BootstrapDialog.TYPE_SUCCESS,
            title: 'Added Product',
            message: data
        });

        GetAllProducts("#tblListingOfProducts");

        DialogWindow.close();

    });

    return true;
}

//custom extension to validate the file size for the uploaded photo
$.validator.addMethod('filesize', function (value, element, param) {
    return this.optional(element) || (element.files[0].size <= param)
}, 'File size must be less than {0}');